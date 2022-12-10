// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { insertEvent } from '../queues/index.js'
import {
  BatchModel,
  CommentModel,
  EReportType,
  IBatchDocument,
  ISuiteDocument,
  ITeam,
  IUser,
  MessageModel,
  ReportModel,
  SuiteModel,
  TeamModel
} from '../schemas/index.js'
import { logger, redisClient } from '../utils/index.js'
import { compareBatch } from './comparison.js'
import { messageRemove } from './message.js'
import { MessageInfo } from './messageInfo.js'

export async function batchNext(
  suiteId: ISuiteDocument['_id']
): Promise<string> {
  const batches = await BatchModel.aggregate([
    { $match: { suite: suiteId } },
    { $sort: { submittedAt: -1 } },
    { $project: { _id: 0, slug: 1 } },
    { $limit: 1 }
  ])
  const isNumeric = (s: string) => !isNaN(parseInt(s))
  const increment = (slug: string, delimiter: string) => {
    const t = slug.split(delimiter)
    if (t.length > 1 && isNumeric(t[t.length - 1])) {
      t[t.length - 1] = (parseInt(t[t.length - 1]) + 1).toString()
      return t.join(delimiter)
    }
  }
  if (batches.length) {
    const slug = batches[0].slug
    return increment(slug, '-') ?? increment(slug, '.') ?? 'v1.0'
  }
  return 'v1.0'
}

export async function batchPromote(
  team: ITeam,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  user: IUser,
  reason: string,
  options: { reportJob: boolean } = { reportJob: true }
): Promise<void> {
  const tuple = [team.slug, suite.slug, batch.slug].join('/')

  // perform promotion of batch

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  const entry: ISuiteDocument['promotions'][0] = {
    at: new Date(),
    by: user._id,
    for: reason,
    from: baselineInfo.to,
    to: batch._id
  }

  await SuiteModel.findByIdAndUpdate(suite._id, {
    $push: { promotions: entry }
  })
  suite.promotions.push(entry)

  logger.info('%s: %s: promoted to baseline', user.username, tuple)

  // find batches with more recent submission date than this batch, and:
  //  * update their `superior` field to have them compare against this
  //    batch by default.
  //  * remove their `meta` field which was based on comparison with the
  //    previous baseline. we leave it to analytics service to re-populate
  //    this field.
  //  * create comparison jobs for them against this batch.
  //    Without this step, comparison jobs will only be created after the
  //    user asks for the comparison result, e.g. by navigating to the batch
  //    page, which is too late to correctly respond to requests such as for
  //    the list of batches.

  const batches = await BatchModel.find({
    suite: suite._id,
    submittedAt: { $gt: batch.submittedAt }
  })

  if (batches.length) {
    logger.info('%s: refreshing metadata of %d batches', tuple, batches.length)

    batches.forEach((v) => compareBatch(batch._id, v._id))

    await BatchModel.updateMany(
      { _id: { $in: batches.map((raw) => raw._id) } },
      { $set: { superior: batch._id }, $unset: { meta: true } }
    )
  }

  // remove information about list of known suites from cache.
  // we wait for this operation to avoid race condition.

  redisClient.removeCachedByPrefix(
    `route_batchList_${team.slug}_${suite.slug}_`
  )
  await redisClient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)

  if (!options.reportJob) {
    logger.debug('%s: skipped creation of reporting job', tuple)
    return
  }

  // find id of the latest batch

  const result: IBatchDocument[] = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } },
    { $limit: 1 },
    { $project: { _id: 1 } }
  ])

  const srcBatchId = result[0]._id
  const dstBatchId = batch._id

  // create a comparison report job between the latest batch and this batch.
  // note that we do this, even if this batch is the same as the latest batch.
  // we rely on reporting service to send notifications, to reuse the same
  // logic for this special case.

  await ReportModel.create({
    srcBatchId,
    dstBatchId,
    reportType: EReportType.Promote
  })
  logger.info('%s: created reporting job against latest', tuple)
}

export async function batchSeal(
  team: ITeam,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  options: { reportJob: boolean } = { reportJob: true }
): Promise<void> {
  const tuple = [team.slug, suite.slug, batch.slug].join('/')

  // perform sealing of batch

  await BatchModel.findByIdAndUpdate(batch._id, { sealedAt: new Date() })
  logger.info('%s: sealed', tuple)

  // remove information about list of known suites from cache.
  // we wait for this operation to avoid race condition.

  await redisClient.removeCached(
    `route_batchLookup_${team.slug}_${suite.slug}_${batch.slug}`
  )
  redisClient.removeCachedByPrefix(
    `route_batchList_${team.slug}_${suite.slug}_`
  )
  await redisClient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)

  await insertEvent({
    type: 'batch:sealed',
    teamId: team._id,
    suiteId: suite._id,
    batchId: batch._id
  })

  if (!options.reportJob) {
    logger.debug('%s: skipped creation of reporting job', tuple)
    return
  }

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  const srcBatchId = batch._id
  const dstBatchId = baselineInfo.to

  // we are done if this batch is the baseline (happens only if this is
  // the first batch)

  if (dstBatchId.equals(srcBatchId)) {
    logger.debug('%s: skipped reporting: new batch is the baseline', tuple)
    return
  }

  // create a comparison report job between this batch and the baseline

  await ReportModel.create({
    srcBatchId,
    dstBatchId,
    reportType: EReportType.Seal
  })
  logger.debug('%s: created reporting job against baseline', tuple)
}

export async function batchRemove(batch: IBatchDocument): Promise<boolean> {
  const suite = await SuiteModel.findById(batch.suite)
  const team = await TeamModel.findById(suite.team)
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  logger.debug('%s: considering removal', tuple)

  // find messages of this batch that need to be removed.

  const messages = (
    await MessageModel.aggregate([
      {
        $match: {
          batchId: batch._id,
          contentId: { $exists: true },
          expiresAt: { $lt: new Date() },
          processedAt: { $exists: true }
        }
      },
      {
        $lookup: {
          as: 'batchDoc',
          foreignField: '_id',
          from: 'batches',
          localField: 'batchId'
        }
      },
      {
        $lookup: {
          as: 'elementDoc',
          foreignField: '_id',
          from: 'elements',
          localField: 'elementId'
        }
      },
      {
        $lookup: {
          as: 'suiteDoc',
          foreignField: '_id',
          from: 'suites',
          localField: 'batchDoc.suite'
        }
      },
      {
        $project: {
          _id: 0,
          batchId: 1,
          batchName: { $arrayElemAt: ['$batchDoc.slug', 0] },
          contentId: 1,
          elementId: 1,
          elementName: { $arrayElemAt: ['$elementDoc.name', 0] },
          messageArtifacts: '$artifacts.key',
          messageId: '$_id',
          suiteId: { $arrayElemAt: ['$suiteDoc._id', 0] },
          suiteName: { $arrayElemAt: ['$suiteDoc.slug', 0] },
          teamSlug: suite.team.toString()
        }
      }
    ])
  ).map((doc) => new MessageInfo(doc))

  if (messages.length === 0) {
    logger.debug('%s: found no removable messages', tuple)
    return false
  }

  // attempt to remove messages

  logger.debug('%s: attempting to remove %d messages', tuple, messages.length)

  const chunkSize = 5
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  for (let i = 0; i < messages.length; i = i + chunkSize) {
    await Promise.all(messages.slice(i, i + chunkSize).map(messageRemove))
    await delay(100)
  }

  // it is possible that we may not have removed all messages for this batch
  // if they had pending comparison jobs, in which case we leave it to the
  // next scheduled execution of this policy enforcement service to remove
  // them.

  if ((await MessageModel.countDocuments({ batchId: batch._id })) !== 0) {
    logger.debug('%s: not all messages were removed', tuple)
    return false
  }

  // if all messages for this batch are removed, we proceed with
  // removing the batch document, its result directory, and any
  // document in the database that referenced this batch.

  await ReportModel.deleteMany({
    $or: [{ srcBatchId: batch._id }, { dstBatchId: batch._id }]
  })
  await CommentModel.deleteMany({ batchId: batch._id })
  await BatchModel.findByIdAndRemove(batch._id)
  logger.info('%s: removed batch', tuple)

  // by removing this batch, we may have removed all batches of the suite
  // it belonged to in which case we proceed with removing the suite.

  if ((await BatchModel.countDocuments({ suite: batch.suite })) === 0) {
    await CommentModel.deleteMany({ suiteId: suite._id })
    await SuiteModel.findByIdAndRemove(suite._id)
    logger.info('%s: removed suite', suite.slug)
  }

  for (const key of [
    `route_suiteLookup_${team.slug}_${suite.slug}`,
    `route_batchLookup_${team.slug}_${suite.slug}_${batch.slug}`,
    `route_commentList_${team.slug}_${suite.slug}_${batch.slug}`
  ]) {
    redisClient.removeCached(key)
  }
  for (const key of [
    `route_suiteList_${team.slug}_`,
    `route_batchList_${team.slug}_${suite.slug}_`,
    `route_batchCompare_${team.slug}_${suite.slug}_${batch.slug}_`,
    `route_elementCompare_${team.slug}_${suite.slug}_${batch.slug}_`,
    `route_elementLookup_${team.slug}_${suite.slug}_`
  ]) {
    redisClient.removeCachedByPrefix(key)
  }
  for (const [prefix, suffix] of [
    [`route_batchCompare_${team.slug}_${suite.slug}_`, `_${batch.slug}`],
    [`route_elementCompare_${team.slug}_${suite.slug}_`, `_${batch.slug}`]
  ]) {
    redisClient.removeCachedByPrefix(prefix, suffix)
  }

  return true
}
