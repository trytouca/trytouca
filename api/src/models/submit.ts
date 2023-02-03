// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { compare, TestcaseComparison } from '@touca/comparator'
import { parseMessageHeaders } from '@touca/flatbuffers'
import { deserialize } from '@touca/flatbuffers'
import { minBy } from 'lodash-es'
import mongoose, { Types } from 'mongoose'

import { comparisonQueue, insertEvent, messageQueue } from '../queues/index.js'
import {
  BatchModel,
  ComparisonModel,
  ElementModel,
  IBatchDocument,
  IComparisonDocument,
  IElementDocument,
  IMessageDocument,
  ISuiteDocument,
  ITeamDocument,
  IUser,
  MessageModel,
  SuiteModel,
  TeamModel
} from '../schemas/index.js'
import { analytics, logger, objectStore, redisClient } from '../utils/index.js'
import { comparisonProcessEvent } from './comparison.js'
import { messageProcess } from './message.js'
import { suiteCreate } from './suite.js'

type TeamSlug = string
type SuiteSlug = string
type BatchSlug = string
type ElementName = string

type SubmissionItem = {
  builtAt: Date
  teamName: TeamSlug
  suiteName: SuiteSlug
  batchName: BatchSlug
  elementName: ElementName
  raw: Buffer

  teamId?: Types.ObjectId
  suiteId?: Types.ObjectId
  batchId?: Types.ObjectId
  elementId?: Types.ObjectId
  messageId?: Types.ObjectId
}

type ElementMap = Map<ElementName, SubmissionItem>
type BatchMap = Map<BatchSlug, ElementMap>
type SuiteMap = Map<SuiteSlug, BatchMap>
type TeamMap = Map<TeamSlug, SuiteMap>
type SubmissionTree = TeamMap

type JobError = string
type JobPass<T> = { slug: string; doc?: T }
type JobFail = { slug: string; errors: JobError[] }
type Job<T> = JobPass<T> | JobFail

function isJobFailed<T>(job: Job<T>): job is JobFail {
  return 'errors' in job
}

function isJobPassed<T>(job: Job<T>): job is JobPass<T> {
  return !isJobFailed(job)
}

async function consolidateJobs<T>(
  slug: string,
  jobs: Promise<Job<T>>[]
): Promise<Job<T[]>> {
  const results = await Promise.all(jobs)
  const failedJobs = results.filter(isJobFailed)
  return failedJobs.length
    ? { slug, errors: failedJobs.flatMap((v) => v.errors) }
    : { slug, doc: results.filter(isJobPassed).flatMap((v) => v.doc) }
}

/**
 * @property {object} override used in a special case when server is
 *    auto-populating a suite with sample test results. Since we want to submit
 *    the same binary data to different suites, we override the slugs of team
 *    and suite in the submitted messages.
 * @property {boolean} sync whether to perform comparison synchronously
 */
export type SubmissionOptions = {
  override?: {
    teamSlug: string
    suiteSlug: string
  }
  sync?: boolean
}

/**
 * In the most common scenario, messages are submitted from a regression
 * test tool in which case they belong to the same team, suite and batch.
 * However, messages submitted to the server are designed to be mutually
 * exclusive. They may belong to different teams, different suites,
 * different batches and different elements.
 *
 * To enable this more general scenario, we organize messages into a
 * "Submission Tree" with multiple levels: team, suite, batch, element.
 * This tree makes it easier for us to validate if client is allowed
 * to submit messages for the specified teams, suites and batches.
 *
 * @throws if there are multiple messages with the same elementName that
 *         belong to the same batch.
 */
async function buildSubmissionTree(
  messages: SubmissionItem[]
): Promise<SubmissionTree> {
  const tree = new Map<TeamSlug, SuiteMap>()
  for (const message of messages) {
    const team = message.teamName
    const suite = message.suiteName
    const batch = message.batchName
    const element = message.elementName
    const tuple = [team, suite, batch, element].join('/')
    if (!tree.has(team)) {
      tree.set(team, new Map<SuiteSlug, BatchMap>())
    }
    const suiteMap = tree.get(team)
    if (!suiteMap.has(suite)) {
      suiteMap.set(suite, new Map<BatchSlug, ElementMap>())
    }
    const batchMap = suiteMap.get(suite)
    if (!batchMap.has(batch)) {
      batchMap.set(batch, new Map<ElementName, SubmissionItem>())
    }
    const elementMap = batchMap.get(batch)
    if (elementMap.has(element)) {
      throw new Error(`duplicate messages for ${tuple}`)
    }
    elementMap.set(element, message)
  }
  return tree
}

function describeSubmissionTree(tree: SubmissionTree): void {
  tree.forEach((suiteMap, teamName) => {
    suiteMap.forEach((batchMap, suiteName) => {
      batchMap.forEach((elementMap, batchName) => {
        const elementPath = [teamName, suiteName, batchName].join('/')
        const elementCount = elementMap.size
        // it is common for regression test tools to submit results
        // one by one in separate submissions.
        if (elementCount === 1) {
          const elementName = elementMap.keys().next().value
          logger.info('%s/%s: received submission', elementPath, elementName)
          return
        }
        // if results are submitted in bulk, we refrain from listing
        // element names of all submissions
        logger.info('%s: received %d submissions', elementPath, elementCount)
      })
    })
  })
}

async function processElement(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  elementName: ElementName,
  submission: SubmissionItem,
  options: SubmissionOptions
): Promise<Job<IElementDocument>> {
  const tuple = [team.slug, suite.slug, batch.slug, elementName].join('/')
  try {
    const element = await ensureElement(team, suite, batch, elementName)
    const message = await ensureMessage(
      user,
      team,
      suite,
      batch,
      element,
      submission
    )
    // store message in binary format in object storage
    await objectStore.addMessage(message.id, submission.raw)
    // if message is already processed, remove its previous content
    if (message.contentId) {
      logger.warn('%s: message already processed', message.id)
      await objectStore.removeResult(message.id)
    }

    submission.teamId = team._id
    submission.suiteId = suite._id
    submission.batchId = batch._id
    submission.elementId = element._id
    submission.messageId = message._id

    await handleMessage(submission, options)

    logger.info('%s: processed element', tuple)

    redisClient.removeCached(
      `route_elementLookup_${team.slug}_${suite.slug}_${elementName}`
    )
    redisClient.removeCached(`route_elementList_${team.slug}_${suite.slug}`)
    insertEvent({
      type: 'message:created',
      teamId: team._id,
      suiteId: suite._id,
      batchId: batch._id
    })

    return { slug: tuple, doc: element }
  } catch (err) {
    return { slug: elementName, errors: [err] }
  }
}

async function handleMessage(
  submission: SubmissionItem,
  options: SubmissionOptions
) {
  if (options.sync) {
    await messageProcess(submission.messageId, submission.raw)
  } else {
    await messageQueue.queue.add(
      submission.messageId.toHexString(),
      {
        batchId: submission.batchId,
        messageId: submission.messageId
      },
      {
        jobId: submission.messageId.toHexString()
      }
    )
  }
}

async function processBatch(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batchSlug: BatchSlug,
  elementMap: ElementMap,
  options: SubmissionOptions
): Promise<Job<IBatchDocument>> {
  const tuple = [team.slug, suite.slug, batchSlug].join('/')
  try {
    // batch may or may not be registered. create it if it is missing.

    const ensureResult = await ensureBatch(user, team, suite, batchSlug)
    if (isJobFailed(ensureResult)) {
      return ensureResult
    }
    const batch = ensureResult.doc

    // concurrently process submitted messages that belong to this batch

    const jobs = Array.from(elementMap).map(([elementName, submission]) => {
      return processElement(
        user,
        team,
        suite,
        batch,
        elementName,
        submission,
        options
      )
    })

    const results = await consolidateJobs(batchSlug, jobs)
    if (isJobFailed(results)) {
      return results
    }
    await updateBatchElements(batch, results.doc)

    logger.debug('%s: processed batch', tuple)
    redisClient.removeCached(
      `route_batchLookup_${team.slug}_${suite.slug}_${batchSlug}`
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

    return { slug: batchSlug, doc: batch }
  } catch (err) {
    return { slug: batchSlug, errors: [err] }
  }
}

async function processTeam(
  user: IUser,
  teamSlug: TeamSlug,
  suiteMap: SuiteMap,
  options: SubmissionOptions
): Promise<Job<TestcaseComparison[]>> {
  // we expect that the team is already registered

  const team = await TeamModel.findOne({ slug: teamSlug, suspended: false })
  if (!team) {
    return { slug: teamSlug, errors: ['team not found'] }
  }

  // we expect that the user is allowed to submit to this team

  const isUserPlatformAdmin =
    user.platformRole === 'owner' || user.platformRole === 'admin'

  const isUserTeamMember =
    team.members.includes(user._id) ||
    team.admins.includes(user._id) ||
    team.owner.equals(user._id)

  if (!isUserPlatformAdmin && !isUserTeamMember) {
    return { slug: teamSlug, errors: ['user not a team member'] }
  }

  // concurrently process submitted messages that belong to suites of this team

  const jobs = Array.from(suiteMap).map(([suiteSlug, batchMap]) => {
    return processSuite(user, team, suiteSlug, batchMap, options)
  })
  const results = await consolidateJobs(teamSlug, jobs)
  if (isJobFailed(results)) {
    return results
  }

  logger.debug('%s: processed team', teamSlug)
  redisClient.removeCachedByPrefix(`route_teamLookup_${teamSlug}_`)
  redisClient.removeCachedByPrefix(`route_teamList_`)
  return { slug: teamSlug, doc: results.doc?.flat() }
}

async function processSubmissionTree(
  user: IUser,
  teamMap: TeamMap,
  options: SubmissionOptions
): Promise<Job<TestcaseComparison[]>> {
  const results = await consolidateJobs(
    '',
    Array.from(teamMap).map(([teamSlug, suiteMap]) =>
      processTeam(user, teamSlug, suiteMap, options)
    )
  )
  return isJobFailed(results) ? results : { slug: '', doc: results.doc?.flat() }
}

async function processSubmissionItem(
  msg: SubmissionItem,
  baseline: mongoose.Types.ObjectId,
  options: SubmissionOptions
): Promise<Job<TestcaseComparison>> {
  const srcBatchId = msg.batchId
  const srcMessageId = msg.messageId
  const srcTuple = [
    msg.teamName,
    msg.suiteName,
    msg.batchName,
    msg.elementName
  ].join('/')

  try {
    // find if a similar element was submitted to the baseline batch.
    const dst: any = await MessageModel.findOne(
      {
        batchId: baseline,
        elementId: msg.elementId
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

    // It is possible that the element is not included in the baseline
    // batch in which case we compare the message with itself. This is
    // un-intuitive but necessary as long as we rely on the comparator
    // to parse flatbuffers data of the message and submit its content
    // to the object storage.

    let dstBatchId = msg.batchId
    let dstMessageId = srcMessageId
    let dstTuple = 'itself'

    if (dst && dst.batchId._id.toString() !== msg.batchId.toString()) {
      dstBatchId = dst.batchId
      dstMessageId = dst.id
      dstTuple = [
        dst.batchId.suite.slug,
        dst.batchId.slug,
        dst.elementId.name
      ].join('/')
    }

    const cmp = await ComparisonModel.create({
      dstBatchId,
      dstMessageId,
      srcBatchId,
      srcMessageId
    })

    if (options.sync) {
      const srcRaw = await objectStore.getMessage(srcMessageId.toString())
      const dstRaw = await objectStore.getMessage(dstMessageId.toString())
      const result = compare(deserialize(srcRaw), deserialize(dstRaw))
      await objectStore.addComparison(cmp.id, JSON.stringify(result.body))
      await ComparisonModel.findByIdAndUpdate(cmp._id, {
        $set: {
          processedAt: new Date(),
          contentId: cmp._id,
          meta: result.overview
        }
      })
      await comparisonProcessEvent(cmp)
      logger.debug('%s: compared with %s', srcTuple, dstTuple)
      return { slug: srcTuple, doc: result }
    }
    await comparisonQueue.queue.add(
      cmp.id,
      {
        jobId: cmp._id,
        dstBatchId: dstBatchId,
        dstMessageId: dstMessageId,
        srcBatchId: srcBatchId,
        srcMessageId: srcMessageId
      },
      {
        jobId: cmp.id
      }
    )
    logger.debug('%s: scheduled comparison with %s', srcTuple, dstTuple)
    return { slug: srcTuple }
  } catch (err) {
    logger.error('%s: failed to process submission item: %O', srcTuple, err)
    return { slug: srcTuple, errors: [err] }
  }
}

async function processSuite(
  user: IUser,
  team: ITeamDocument,
  suiteSlug: SuiteSlug,
  batchMap: BatchMap,
  options: SubmissionOptions
): Promise<Job<TestcaseComparison[]>> {
  const tuple = [team.slug, suiteSlug].join('/')
  try {
    let suite: ISuiteDocument = await SuiteModel.findOne({
      team: team._id,
      slug: suiteSlug
    })
    if (!suite) {
      suite = await suiteCreate(user, team, {
        slug: suiteSlug,
        name: suiteSlug
      })
      analytics.add_activity('suite:created', user)
    }

    // concurrently process submitted messages that belong to batches of this suite

    const batchJobs = Array.from(batchMap).map(([batchSlug, elementMap]) => {
      return processBatch(user, team, suite, batchSlug, elementMap, options)
    })
    const batchResults = await consolidateJobs(suiteSlug, batchJobs)
    if (isJobFailed(batchResults)) {
      return batchResults
    }

    // at this point, we are sure that all batches have been processed
    // successfully.

    // if suite has no baseline, establish the baseline at the earliest
    // received batch.
    //
    // note: this operation involves an exceptional treatment of the
    //       first submitted batch: normally, promotion of a batch to
    //       suite baseline is only possible when batch is already
    //       sealed. However in this case, we intentionally leave the
    //       batch unsealed to allow users to continue submitting results
    //       for this batch.

    if (suite.promotions.length === 0) {
      const earliestBatch = minBy(batchResults.doc, (b) => b.submittedAt)

      const entry: ISuiteDocument['promotions'][number] = {
        at: new Date(),
        by: user._id,
        for: 'N/A',
        from: earliestBatch._id,
        to: earliestBatch._id
      }

      await SuiteModel.findByIdAndUpdate(suite._id, {
        $push: { promotions: entry }
      })
      suite.promotions.push(entry)

      logger.info('%s: established baseline at %s', tuple, earliestBatch.slug)
    }

    // now that we have made sure suite has a baseline, we proceed with
    // concurrently creating comparison jobs for every submitted result
    // message.

    const baseline = suite.promotions.at(-1).to
    const suiteJobs = Array.from(batchMap.values())
      .flatMap((v) => Array.from(v.values()))
      .map((v) => processSubmissionItem(v, baseline, options))
    const suiteResults = await consolidateJobs(suiteSlug, suiteJobs)
    if (isJobFailed(suiteResults)) {
      return suiteResults
    }

    logger.debug('%s: processed suite', tuple)

    redisClient.removeCached(`route_suiteLookup_${team.slug}_${suiteSlug}`)
    redisClient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
    insertEvent({
      type: 'suite:updated',
      teamId: team._id,
      suiteId: suite._id,
      batchId: undefined
    })

    return suiteResults
  } catch (err) {
    return { slug: suiteSlug, errors: [err] }
  }
}

async function ensureBatch(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batchSlug: BatchSlug
): Promise<Job<IBatchDocument>> {
  const tuple = [team.slug, suite.slug, batchSlug].join('/')

  const batch = await BatchModel.findOne({ slug: batchSlug, suite: suite._id })
  if (batch) {
    if (batch.sealedAt) {
      return { slug: batchSlug, errors: ['batch is sealed'] }
    }
    logger.silly('%s: batch is known', tuple)
    if (!batch.submittedBy.some((submitter) => submitter.equals(user._id))) {
      await BatchModel.findByIdAndUpdate(batch._id, {
        $push: { submittedBy: user._id }
      })
    }
    return { slug: batchSlug, doc: batch }
  }

  // otherwise create the batch.
  // one required field of a batch document is `superior` which indicates
  // the batch in this suite that is, at the time, the baseline of the suite.
  // this field is used by batch comparison service to populate `meta` field
  // when this batch is sealed. In special case when this batch is the first
  // batch of the suite, we do not have id of the `superior` batch prior to
  // creating this batch. Therefore, we create the document and separately
  // save it, instead of the usual call to `BatchModel.create`.

  const newBatch = new BatchModel({
    slug: batchSlug,
    submittedAt: new Date(),
    submittedBy: [user._id],
    suite: suite.id
  })

  newBatch.superior = suite.promotions.length
    ? suite.promotions.at(-1).to
    : newBatch._id

  await newBatch.save()

  insertEvent({
    type: 'batch:created',
    teamId: team._id,
    suiteId: suite._id,
    batchId: newBatch._id
  })
  logger.info('%s: registered batch', tuple)
  return { slug: batchSlug, doc: newBatch }
}

/** register element if it is not already registered */
async function ensureElement(
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  elementName: string
) {
  const tuple = [team.slug, suite.slug, batch.slug, elementName].join('/')
  const element = await ElementModel.findOne({
    slug: elementName,
    suiteId: suite._id
  })
  if (element) {
    logger.silly('%s: element is known', tuple)
    return element
  }
  logger.info('%s: registered element', tuple)
  return await ElementModel.create({
    name: elementName,
    slug: elementName,
    suiteId: suite._id
  })
}

async function ensureMessage(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  element: IElementDocument,
  submission: SubmissionItem
): Promise<IMessageDocument> {
  const tuple = [team.slug, suite.slug, batch.slug, element.name].join('/')

  const message = await MessageModel.findOne({
    batchId: batch._id,
    elementId: element._id
  })

  const doc = {
    batchId: batch.id,
    builtAt: submission.builtAt,
    elementId: element.id,
    expiresAt: new Date(Date.now() + suite.retainFor * 1000),
    submittedAt: new Date(),
    submittedBy: user._id
  }

  if (!message) {
    logger.debug('%s: registered message', tuple)
    return await MessageModel.create(doc)
  }

  // If message is already known, overwrite it and extend its expiration time.
  // Given that the message may be different, all previously generated
  // comparison results may be invalid. So we opt to remove those comparison
  // jobs both from the object store and from the database. For faster
  // submission processing, we choose not to wait for these removals to
  // complete.

  const query = [{ dstMessageId: message._id }, { srcMessageId: message._id }]

  ComparisonModel.find(
    { $or: query, contentId: { $exists: true } },
    { contentId: 1 }
  )
    .cursor()
    .eachAsync(
      (job: IComparisonDocument) => objectStore.removeComparison(job.id),
      { parallel: 10 }
    )

  if (message.contentId) {
    objectStore.removeResult(message.id)
  }

  await ComparisonModel.deleteOne({ $or: query })

  logger.debug('%s: overwrote message', tuple)
  return await MessageModel.findByIdAndUpdate(message._id, {
    $set: { doc },
    $unset: { contentId: 1, meta: 1, processedAt: 1 }
  })
}

async function updateBatchElements(
  batch: IBatchDocument,
  elements: IElementDocument[]
): Promise<void> {
  const existing = await BatchModel.findById(batch.id, {
    elements: true
  }).populate('elements')

  const novel = elements
    .map((el) => el._id)
    .filter((el1) => !existing.elements.some((el2) => el2.equals(el1)))

  if (novel.length !== 0) {
    await BatchModel.findByIdAndUpdate(
      { _id: batch._id },
      {
        $push: { elements: { $each: novel } }
      }
    )
  }
}

export async function processBinaryContent(
  user: IUser,
  content: Uint8Array,
  options: SubmissionOptions
): Promise<Job<TestcaseComparison[]>> {
  const messages = parseMessageHeaders(content)
  if (options.override) {
    for (const message of messages) {
      message.teamName = options.override.teamSlug
      message.suiteName = options.override.suiteSlug
    }
  }
  const tree = await buildSubmissionTree(messages)
  describeSubmissionTree(tree)
  return processSubmissionTree(user, tree, options)
}
