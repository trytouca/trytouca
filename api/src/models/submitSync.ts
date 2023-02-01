import { compare, TestcaseComparison } from '@touca/comparator'
import { deserialize, parseMessageHeaders } from '@touca/flatbuffers'
import mongoose from 'mongoose'

import { insertEvent } from '../queues/index.js'
import { buildMessageOverview, transformMessage } from '../queues/message.js'
import {
  BatchModel,
  ComparisonModel,
  ElementModel,
  IBatchDocument,
  IElementDocument,
  ISuiteDocument,
  ITeamDocument,
  IUser,
  MessageModel,
  SuiteModel,
  TeamModel
} from '../schemas/index.js'
import { analytics, logger, objectStore, redisClient } from '../utils/index.js'
import { comparisonProcessEvent } from './comparison.js'
import {
  ensureBatch,
  ensureMessage,
  SubmissionItem,
  updateBatchElements
} from './submit.js'
import { suiteCreate } from './suite.js'

// these generic types describe the result of the functions in this module, to
// ensure a consistent interface.

type Success<Status extends number, Data> = {
  type: 'success'
  status: Status
  data: Data
}

type Failure<Status extends number, Error extends string> = {
  type: 'failure'
  status: Status
  error: Error
}

// synchronized comparison assumes input contains a single message with a single
// element. this function serves as the entry point that receives such input
// from a user, parses metadata, and passes it down the pipeline for actual
// processing.

type ProcessBinaryContentSuccess = ProcessTeamSuccess

type ProcessBinaryContentFailure =
  | ProcessTeamFailure
  | Failure<400, 'expected exactly one message'>

type ProcessBinaryContentResult =
  | ProcessBinaryContentSuccess
  | ProcessBinaryContentFailure

export async function processBinaryContentSync(
  user: IUser,
  content: Uint8Array
): Promise<ProcessBinaryContentResult> {
  const [submission, ...others] = parseMessageHeaders(content)

  if (others.length > 0) {
    return {
      type: 'failure',
      status: 400,
      error: 'expected exactly one message'
    }
  }

  const path = [
    submission.teamName,
    submission.suiteName,
    submission.batchName,
    submission.elementName
  ].join('/')

  logger.info('%s: parsed submission headers (sync)', path)

  const teamResult = processTeamSync(user, submission)

  return teamResult
}

// since we deal with a single message, we don't need to build a submission tree
// like we do with asynchronous submissions. this function receives one such
// submission, ensures the team exists and is accessible by the user. it then
// processes the message and returns the comparison result back to the caller.

type ProcessTeamSuccess = Success<200, TestcaseComparison>

type ProcessTeamFailure =
  | Failure<400, 'team access not authorized'>
  | Failure<400, 'team not found'>
  | ProcessSuiteFailure

type ProcessTeamResult = ProcessTeamSuccess | ProcessTeamFailure

async function processTeamSync(
  user: IUser,
  submission: SubmissionItem
): Promise<ProcessTeamResult> {
  const team = await TeamModel.findOne({
    slug: submission.teamName,
    suspended: false
  })

  if (!team) {
    return { type: 'failure', status: 400, error: 'team not found' }
  }

  const isUserPlatformAdmin =
    user.platformRole === 'owner' || user.platformRole === 'admin'

  const isUserTeamMember =
    team.members.includes(user._id) ||
    team.admins.includes(user._id) ||
    team.owner.equals(user._id)

  if (!isUserPlatformAdmin && !isUserTeamMember) {
    return {
      type: 'failure',
      status: 400,
      error: 'team access not authorized'
    }
  }

  const suiteResult = await processSuiteSync(user, team, submission)

  if (suiteResult.type == 'failure') {
    return suiteResult
  }

  logger.debug('%s: processed team (sync)', team.slug)

  redisClient.removeCachedByPrefix(`route_teamLookup_${team.slug}_`)
  redisClient.removeCachedByPrefix(`route_teamList_`)

  return suiteResult
}

// once the team has been validated, this function ensures the suite exists and
// has a baseline, and proceeds to run the comparison against this baseline.

type ProcessSuiteSuccess = Success<200, TestcaseComparison>

type ProcessSuiteFailure = ProcessBatchFailure | CompareSyncFailure

type ProcessSuiteResult = ProcessSuiteSuccess | ProcessSuiteFailure

async function processSuiteSync(
  user: IUser,
  team: ITeamDocument,
  submission: SubmissionItem
): Promise<ProcessSuiteResult> {
  let suite: ISuiteDocument = await SuiteModel.findOne({
    team: team._id,
    slug: submission.suiteName
  })

  if (!suite) {
    suite = await suiteCreate(user, team, {
      slug: submission.suiteName,
      name: submission.suiteName
    })

    analytics.add_activity('suite:created', user)
  }

  const path = [team.slug, suite.slug].join('/')
  const batchResult = await processBatchSync(user, team, suite, submission)

  if (batchResult.type == 'failure') {
    return batchResult
  }

  if (suite.promotions.length == 0) {
    const batch = batchResult.data
    const entry: ISuiteDocument['promotions'][number] = {
      at: new Date(),
      by: user._id,
      for: 'N/A',
      from: batch._id,
      to: batch._id
    }

    await SuiteModel.findByIdAndUpdate(suite._id, {
      $push: { promotions: entry }
    })

    suite.promotions.push(entry)

    logger.info('%s: established suite baseline at %s', path, batch.slug)
  }

  const baselineId = suite.promotions.at(-1).to
  const compareResult = await compareSync(submission, baselineId)

  if (compareResult.type == 'failure') {
    return compareResult
  }

  logger.debug('%s: processed suite (sync)', path)

  redisClient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
  redisClient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)

  insertEvent({
    type: 'suite:updated',
    teamId: team._id,
    suiteId: suite._id,
    batchId: undefined
  })

  return { type: 'success', status: 200, data: compareResult.data }
}

// once the suite is ensured and validated, this function ensures the batch is
// not sealed, and then proceeds to process the submitted element and update the
// batch accordingly.

type ProcessBatchSuccess = Success<200, IBatchDocument> | ProcessElementSuccess

type ProcessBatchFailure =
  | Failure<400, 'batch is sealed'>
  | ProcessElementFailure

type ProcessBatchResult = ProcessBatchSuccess | ProcessBatchFailure

async function processBatchSync(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  submission: SubmissionItem
): Promise<ProcessBatchResult> {
  const batchResult = await ensureBatch(user, team, suite, submission.batchName)

  if (batchResult.type == 'error') {
    return { type: 'failure', status: 400 }
  }

  const batch = batchResult.doc
  const path = [team.slug, suite.slug, batch.slug].join('/')

  const elementResult = await processElementSync(
    user,
    team,
    suite,
    batch,
    submission
  )

  if (elementResult.type == 'failure') {
    return elementResult
  }

  await updateBatchElements(batch, [elementResult.data])

  logger.debug('%s: processed batch (sync)', path)

  redisClient.removeCached(
    `route_batchLookup_${team.slug}_${suite.slug}_${batch.slug}`
  )

  redisClient.removeCachedByPrefix(
    `route_batchList_${team.slug}_${suite.slug}_`
  )

  insertEvent({
    type: 'batch:updated',
    teamId: team._id,
    suiteId: suite._id,
    batchId: batch._id
  })

  return { type: 'success', status: 200, data: batch }
}

// once the batch is ensured and validated, this function ensures the element
// and the corresponding message are stored and in proper state. this function
// internally implements the logic of processMessage for async submissions.

type ProcessElementSuccess = Success<200, IElementDocument>

type ProcessElementFailure = Failure<500, 'message storage failed'>

type ProcessElementResult = ProcessElementSuccess | ProcessElementFailure

async function processElementSync(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  submission: SubmissionItem
): Promise<ProcessElementResult> {
  const element = await ensureElementSync(
    team,
    suite,
    batch,
    submission.elementName
  )
  const path = [team.slug, suite.slug, batch.slug, element.slug].join('/')
  const message = await ensureMessage(
    user,
    team,
    suite,
    batch,
    element,
    submission
  )

  await objectStore.addMessage(message.id, submission.raw)

  const src = deserialize(submission.raw)
  if (message.contentId) {
    logger.warn('%s: message already processed', message.id)
    await objectStore.removeResult(message.id)
  }
  await objectStore.addResult(message.id, JSON.stringify(transformMessage(src)))
  await MessageModel.findByIdAndUpdate(message._id, {
    $set: {
      processedAt: new Date(),
      contentId: message._id,
      meta: buildMessageOverview(src)
    }
  })

  submission.teamId = team._id
  submission.suiteId = suite._id
  submission.batchId = batch._id
  submission.elementId = element._id
  submission.messageId = message._id

  logger.info('%s: processed element (sync)', path)

  redisClient.removeCached(
    `route_elementLookup_${team.slug}_${suite.slug}_${element.slug}`
  )
  redisClient.removeCached(`route_elementList_${team.slug}_${suite.slug}`)
  insertEvent({
    type: 'message:created',
    teamId: team.id,
    suiteId: suite.id,
    batchId: batch.id
  })

  return { type: 'success', status: 200, data: element }
}

// this function is basically the same as the one used by the async workflow.

export async function ensureElementSync(
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  elementName: string
): Promise<IElementDocument> {
  const path = [team.slug, suite.slug, batch.slug, elementName].join('/')

  let element = await ElementModel.findOne({
    slug: elementName,
    suiteId: suite._id
  })

  if (element) {
    logger.silly('%s: element known', path)

    return element
  }

  element = await ElementModel.create({
    name: elementName,
    slug: elementName,
    suiteId: suite._id
  })

  logger.info('%s: element registered', path)

  return element
}

// this function internally implements the functionality of comparisonProcess
// from the async submission workflow.

type CompareSyncSuccess = Success<201, TestcaseComparison>

type CompareSyncFailure = Failure<500, 'comparison storage failed'>

type CompareSyncResult = CompareSyncSuccess | CompareSyncFailure

async function compareSync(
  submission: SubmissionItem,
  baseline: mongoose.Types.ObjectId
): Promise<CompareSyncResult> {
  const srcBatchId = submission.batchId
  const srcMessageId = submission.messageId
  const srcPath = [
    submission.teamName,
    submission.suiteName,
    submission.batchName,
    submission.elementName
  ].join('/')

  const dst: any = await MessageModel.findOne(
    {
      batchId: baseline,
      elementId: submission.elementId
    },
    {
      batchId: 1,
      elementId: 1,
      expiresAt: 1
    }
  )
    .populate({
      path: 'batchId',
      populate: {
        path: 'suite',
        select: 'slug'
      },
      select: 'slug suite'
    })
    .populate({
      path: 'elementId',
      select: 'name'
    })

  let dstBatchId = submission.batchId
  let dstMessageId = srcMessageId
  let dstTuple = 'itself'

  if (dst && dst.batchId._id.toString() !== submission.batchId.toString()) {
    dstBatchId = dst.batchId
    dstMessageId = dst.id
    dstTuple = [
      dst.batchId.suite.slug,
      dst.batchId.slug,
      dst.elementId.name
    ].join('/')
  }

  const comparison = await ComparisonModel.create({
    dstBatchId,
    dstMessageId,
    srcBatchId,
    srcMessageId
  })

  const srcRaw = await objectStore.getMessage(srcMessageId.toString())
  const dstRaw = await objectStore.getMessage(dstMessageId.toString())
  const srcParsed = deserialize(srcRaw)
  const dstParsed = deserialize(dstRaw)
  const result = compare(srcParsed, dstParsed)
  const added = await objectStore.addComparison(
    comparison.id,
    JSON.stringify(result.body)
  )

  if (!added) {
    return {
      type: 'failure',
      status: 500,
      error: 'comparison storage failed'
    }
  }

  await ComparisonModel.findByIdAndUpdate(comparison._id, {
    $set: {
      processedAt: new Date(),
      contentId: comparison._id,
      meta: result.overview
    }
  })

  await comparisonProcessEvent(comparison)

  logger.debug('%s: comparison done (sync) with %s', srcPath, dstTuple)

  return { type: 'success', status: 201, data: result }
}
