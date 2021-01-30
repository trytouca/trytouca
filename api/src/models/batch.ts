/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { messageRemove } from './message'
import { BatchModel, IBatchDocument } from '../schemas/batch'
import { CommentModel } from '../schemas/comment'
import { ReportModel, EReportType } from '../schemas/report'
import { MessageModel } from '../schemas/message'
import { SuiteModel, ISuiteDocument } from '../schemas/suite'
import { TeamModel, ITeam } from '../schemas/team'
import { MessageInfo } from './messageInfo'
import { filestore } from '../utils/filestore'
import { rclient } from '../utils/redis'
import logger from '../utils/logger'

/**
 *
 */
export async function batchSeal(
  team: ITeam,
  suite: ISuiteDocument,
  batch: IBatchDocument
): Promise<void> {
  const tuple = [team.slug, suite.slug, batch.slug].join('/')

  // perform sealing of batch

  await BatchModel.findByIdAndUpdate(batch._id, { sealedAt: new Date() })
  logger.info('%s: sealed', tuple)

  // remove information about list of known suites from cache.
  // we wait for this operation to avoid race condition.

  await rclient.removeCached(
    `route_batchLookup_${team.slug}_${suite.slug}_${batch.slug}`
  )
  rclient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}_`)
  await rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)

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

/**
 *
 */
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
          elasticId: { $exists: true },
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
          elasticId: 1,
          elementId: 1,
          elementName: { $arrayElemAt: ['$elementDoc.name', 0] },
          messageId: '$_id',
          suiteId: { $arrayElemAt: ['$suiteDoc._id', 0] },
          suiteName: { $arrayElemAt: ['$suiteDoc.slug', 0] }
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
  await filestore.removeEmptyDir(batch._id)
  logger.info('%s: removed batch', tuple)

  rclient.removeCached(
    `route_batchLookup_${team.slug}_${suite.slug}_${batch.slug}`
  )
  rclient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}_`)

  // by removing this batch, we may have removed all batches of the suite
  // it belonged to in which case we proceed with removing the suite.

  if ((await BatchModel.countDocuments({ suite: batch.suite })) === 0) {
    await CommentModel.deleteMany({ suiteId: suite._id })
    await SuiteModel.findByIdAndRemove(suite._id)
    logger.info('%s: removed suite', suite.slug)

    rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
    rclient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
  }

  return true
}
