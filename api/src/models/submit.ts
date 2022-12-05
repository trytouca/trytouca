// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { parseMessageHeaders } from '@touca/flatbuffers'
import { minBy } from 'lodash-es'
import mongoose, { Types } from 'mongoose'

import { suiteCreate } from '../models/suite.js'
import { comparisonQueue, insertEvent, messageQueue } from '../queues/index.js'
import { BatchModel, IBatchDocument } from '../schemas/batch.js'
import { ComparisonModel, IComparisonDocument } from '../schemas/comparison.js'
import { ElementModel, IElementDocument } from '../schemas/element.js'
import { MessageModel } from '../schemas/message.js'
import { ISuiteDocument, SuiteModel } from '../schemas/suite.js'
import { ITeamDocument, TeamModel } from '../schemas/team.js'
import { IUser } from '../schemas/user.js'
import logger from '../utils/logger.js'
import { redisClient } from '../utils/redis.js'
import { objectStore } from '../utils/store.js'
import { analytics, EActivity } from '../utils/tracker.js'

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
type JobPass<T> = { slug: string; doc: T }
type JobFail = { slug: string; errors: JobError[] }
type Job<T> = JobPass<T> | JobFail

const isJobFailed = <T>(job: Job<T>) => (job as JobFail).errors !== undefined

const extractJobErrors = <T>(jobs: Job<T>[]): JobError[] => {
  return jobs
    .filter(isJobFailed)
    .map((job: JobFail) => job.errors.map((err) => `${job.slug}: ${err}`))
    .reduce((acc, val) => acc.concat(val), [])
}

const makeError = (slug: string, error: string) => {
  return { slug, errors: [error] }
}

/**
 * In the most common scenario, messages are submitted from a regression
 * test tool in which case they belong to the same team, suite and batch.
 * However, messages submitted to the platform are designed to be mutually
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
  submission: SubmissionItem
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
    await objectStore.addMessage(message._id.toHexString(), submission.raw)
    // create a job on the queue to process message
    await messageQueue.queue.add(
      message.id,
      {
        batchId: batch._id,
        messageId: message._id
      },
      {
        jobId: message.id
      }
    )

    // update submission metadata with id of its parent nodes.
    // this is not an ideal design pattern but it removes the need
    // to propagate back the document ids for use in operations like
    // creation of comparison jobs that are safer to happen after all
    // submitted elements are processed.

    submission.teamId = team._id
    submission.suiteId = suite._id
    submission.batchId = batch._id
    submission.elementId = element._id
    submission.messageId = message._id

    logger.info('%s: processed element', tuple)

    redisClient.removeCached(
      `route_elementLookup_${team.slug}_${suite.slug}_${elementName}`
    )
    redisClient.removeCached(`route_elementList_${team.slug}_${suite.slug}`)

    return { slug: tuple, doc: element }
  } catch (err) {
    return makeError(elementName, err)
  }
}

async function processBatch(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batchSlug: BatchSlug,
  elementMap: ElementMap
): Promise<Job<IBatchDocument>> {
  const tuple = [team.slug, suite.slug, batchSlug].join('/')
  try {
    // batch may or may not be registered. create it if it is missing.

    const ensureResult = await ensureBatch(user, team, suite, batchSlug)
    if (isJobFailed(ensureResult)) {
      return ensureResult
    }
    const batch = (ensureResult as JobPass<IBatchDocument>).doc

    // concurrently process submitted messages that belong to this batch

    const jobs = Array.from(elementMap).map(([elementName, submission]) => {
      return processElement(user, team, suite, batch, elementName, submission)
    })

    const results = await Promise.all(jobs)

    const errors = extractJobErrors(results)
    if (errors.length !== 0) {
      return { slug: batchSlug, errors }
    }

    // insert all newly submitted elements to the list of elements
    // registered for this batch.

    const elements = results
      .filter((e) => !isJobFailed(e))
      .map((e: JobPass<IElementDocument>) => e.doc)

    await updateBatchElements(batch, elements)

    logger.debug('%s: processed batch', tuple)

    redisClient.removeCached(
      `route_batchLookup_${team.slug}_${suite.slug}_${batchSlug}`
    )
    redisClient.removeCachedByPrefix(
      `route_batchList_${team.slug}_${suite.slug}_`
    )

    await insertEvent({
      type: 'batch:processed',
      teamId: team._id,
      suiteId: suite._id,
      batchId: batch._id
    })

    return { slug: batchSlug, doc: batch }
  } catch (err) {
    return makeError(batchSlug, err)
  }
}

async function processTeam(
  user: IUser,
  teamSlug: TeamSlug,
  suiteMap: SuiteMap
): Promise<Job<ITeamDocument>> {
  // we expect that the team is already registered

  const team = await TeamModel.findOne({ slug: teamSlug, suspended: false })
  if (!team) {
    return makeError(teamSlug, 'team not found')
  }

  // we expect that the user is allowed to submit to this team

  const isUserPlatformAdmin =
    user.platformRole === 'owner' || user.platformRole === 'admin'

  const isUserTeamMember =
    team.members.includes(user._id) ||
    team.admins.includes(user._id) ||
    team.owner.equals(user._id)

  if (!isUserPlatformAdmin && !isUserTeamMember) {
    return makeError(teamSlug, 'user not a team member')
  }

  // concurrently process submitted messages that belong to suites of this team

  const jobs = Array.from(suiteMap).map(([suiteSlug, batchMap]) => {
    return processSuite(user, team, suiteSlug, batchMap)
  })

  const results = await Promise.all(jobs)

  const errors = extractJobErrors(results)
  if (errors.length !== 0) {
    return { slug: teamSlug, errors }
  }

  logger.debug('%s: processed team', teamSlug)

  redisClient.removeCachedByPrefix(`route_teamLookup_${teamSlug}_`)
  redisClient.removeCachedByPrefix(`route_teamList_`)

  return { slug: teamSlug, doc: team }
}

async function processSubmissionTree(
  user: IUser,
  teamMap: TeamMap
): Promise<JobError[]> {
  const jobs = Array.from(teamMap).map(([teamSlug, suiteMap]) => {
    return processTeam(user, teamSlug, suiteMap)
  })

  const results = await Promise.all(jobs)

  return extractJobErrors(results)
}

async function insertComparisonJob(
  msg: SubmissionItem,
  baseline: mongoose.Types.ObjectId
): Promise<string> {
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
  } catch (err) {
    logger.error('%s: failed to create comparison job: %O', srcTuple, err)
    return srcTuple
  }
}

async function insertComparisonJobs(
  batchMap: BatchMap,
  baseline: Types.ObjectId
): Promise<string[]> {
  // now that we have made sure suite has a baseline, we proceed with
  // concurrently creating comparison jobs for every submitted result
  // message.

  const jobs: Promise<string>[] = []
  batchMap.forEach((elementMap) =>
    elementMap.forEach((submission) => {
      jobs.push(insertComparisonJob(submission, baseline))
    })
  )

  // wait for all comparison jobs to be created.
  // we are sure that all jobs are going to be resolved.

  const results = await Promise.all(jobs)
  const failed = results.filter(Boolean)

  failed.forEach((v) => logger.warn('%s: failed to create comparison job', v))
  return failed
}

/**
 * Check if a suite with given name is registered.
 */
async function processSuite(
  user: IUser,
  team: ITeamDocument,
  suiteSlug: SuiteSlug,
  batchMap: BatchMap
): Promise<Job<ISuiteDocument>> {
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
      analytics.add_activity(EActivity.SuiteCreated, user)
    }

    // concurrently process submitted messages that belong to batches of this suite

    const jobs = Array.from(batchMap).map(([batchSlug, elementMap]) => {
      return processBatch(user, team, suite, batchSlug, elementMap)
    })

    const results = await Promise.all(jobs)

    // if we have encountered any errors when processing batches, stop
    // further processing the suite and report errors.

    const errors = extractJobErrors(results)
    if (errors.length !== 0) {
      return { slug: suiteSlug, errors }
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
      const batches = results.map((val: JobPass<IBatchDocument>) => val.doc)
      const earliestBatch = minBy(batches, (b) => b.submittedAt)

      const entry: ISuiteDocument['promotions'][0] = {
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

    // find baseline information

    const baselineInfo = suite.promotions[suite.promotions.length - 1]

    // now that we have made sure suite has a baseline, we proceed with
    // concurrently creating comparison jobs for every submitted result
    // message.

    const compareErrors = await insertComparisonJobs(batchMap, baselineInfo.to)
    if (compareErrors.length !== 0) {
      return { slug: suiteSlug, errors: compareErrors }
    }

    logger.debug('%s: processed suite', tuple)

    redisClient.removeCached(`route_suiteLookup_${team.slug}_${suiteSlug}`)
    redisClient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)

    return { slug: suiteSlug, doc: suite }
  } catch (err) {
    makeError(suiteSlug, err)
  }
}

async function ensureBatch(
  user: IUser,
  team: ITeamDocument,
  suite: ISuiteDocument,
  batchSlug: BatchSlug
): Promise<Job<IBatchDocument>> {
  const tuple = [team.slug, suite.slug, batchSlug].join('/')

  // check if batch is already registered

  const batch = await BatchModel.findOne({ slug: batchSlug, suite: suite._id })
  if (batch && batch.sealedAt) {
    return makeError(batchSlug, 'batch is sealed')
  }

  // if batch exists, update list of users submitting to this batch

  if (batch) {
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
    ? suite.promotions[suite.promotions.length - 1].to
    : newBatch._id

  await newBatch.save()

  logger.info('%s: registered batch', tuple)
  return { slug: batchSlug, doc: newBatch }
}

async function ensureElement(
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  elementName: string
) {
  const tuple = [team.slug, suite.slug, batch.slug, elementName].join('/')

  // check if element is already registered

  const element = await ElementModel.findOne({
    slug: elementName,
    suiteId: suite._id
  })

  // we are done if element is already registered

  if (element) {
    logger.silly('%s: element is known', tuple)
    return element
  }

  // otherwise create the element

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
) {
  const tuple = [team.slug, suite.slug, batch.slug, element.name].join('/')

  // check if message is already registered

  const message = await MessageModel.findOne({
    batchId: batch._id,
    elementId: element._id
  })

  // adjust expiration date of the message

  const duration = suite.retainFor
  const expiresAt = new Date()
  expiresAt.setSeconds(expiresAt.getSeconds() + duration)

  // prepare message for insertion into database

  const doc = {
    batchId: batch.id,
    builtAt: submission.builtAt,
    elementId: element.id,
    expiresAt,
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
      (job: IComparisonDocument) =>
        objectStore.removeComparison(job._id.toHexString()),
      { parallel: 10 }
    )

  if (message.contentId) {
    objectStore.removeResult(message._id.toHexString())
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
  options?: {
    override?: {
      teamSlug: string
      suiteSlug: string
    }
  }
) {
  // attempt to parse binary content into a list of messages

  const messages = parseMessageHeaders(content)

  // in a special case when platform is auto-populating a suite with sample
  // test results, we want to submit the same binary data to different suites.
  // to support this case, we like to override the slugs of team and suite
  // in the submitted messages.

  if (options?.override) {
    for (const message of messages) {
      message.teamName = options.override.teamSlug
      message.suiteName = options.override.suiteSlug
    }
  }

  // organize submitted messages into a tree hierarchy

  const tree = await buildSubmissionTree(messages)

  // log the structure of the tree (mostly for debugging purposes)

  describeSubmissionTree(tree)

  // process submission tree

  return processSubmissionTree(user, tree)
}
