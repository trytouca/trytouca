// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { batchRemove } from '../models/batch.js'
import { comparisonRemove } from '../models/comparison.js'
import { BatchModel, IBatchDocument } from '../schemas/batch.js'
import { ComparisonModel } from '../schemas/comparison.js'
import { MessageModel } from '../schemas/message.js'
import { ISuiteDocument, SuiteModel } from '../schemas/suite.js'
import { config } from '../utils/config.js'
import logger from '../utils/logger.js'

async function isBatchDueForRemoval(batch: IBatchDocument): Promise<boolean> {
  const suite = await SuiteModel.findById(batch.suite)
  const tuple = [suite.slug, batch.slug].join('/')

  // if batch has any message that is not yet expired
  // it is not due for removal

  const query = { batchId: batch._id, expiresAt: { $gte: new Date() } }

  if (await MessageModel.countDocuments(query)) {
    logger.silly('%s: batch has unexpired messages', tuple)
    return false
  }

  // if batch is currently promoted as baseline of a suite
  // it is not due for removal

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  if (batch._id.equals(baselineInfo.to)) {
    logger.silly('%s: skipping baseline', tuple)
    return false
  }

  // otherwise report that it can be considered for removal

  return true
}

async function pruneBatches(): Promise<void> {
  const batches = await BatchModel.find({ expirable: true })
  for (const batch of batches) {
    if (await isBatchDueForRemoval(batch)) {
      await batchRemove(batch)
    }
  }
}

async function pruneComparisonResults(): Promise<void> {
  // find list of every suite that has a baseline

  const suites: ISuiteDocument[] = await SuiteModel.aggregate([
    { $match: { promotions: { $exists: true, $not: { $size: 0 } } } },
    { $project: { _id: 0, promotions: 1 } }
  ])

  // extract _id of the batch that is the baseline of those suites

  const batchesPromoted = suites.map((suite) => {
    const baselineInfo = suite.promotions[suite.promotions.length - 1]
    return baselineInfo.to
  })

  // find all batches that are not baseline of their suite

  const batches = (
    await BatchModel.aggregate([
      { $match: { expirable: true, _id: { $nin: batchesPromoted } } },
      { $project: { _id: 1 } }
    ])
  ).map((elem) => elem._id)

  // we are done if we have no batch to work with

  if (batches.length === 0) {
    return
  }

  // find comparison jobs whose src and dst batches are among the batches
  // that can be pruned

  const threshold = new Date()
  threshold.setSeconds(
    threshold.getSeconds() - config.services.retention.resultLifetime
  )
  const jobs = await ComparisonModel.find(
    {
      dstBatchId: { $in: batches },
      processedAt: { $exists: true, $lt: threshold },
      srcBatchId: { $in: batches }
    },
    { _id: 1, contentId: 1 }
  )

  // remove all comparison jobs that can be pruned

  if (jobs.length !== 0) {
    await comparisonRemove(jobs)
  }
}

/**
 * Checks for and removes submissions whose expiration date is past
 * and are due for removal. Responsible for enforcing data retention
 * policy on the platform.
 * This function is meant to be called periodically by the top-level
 * script.
 */
export async function retentionService(): Promise<void> {
  logger.info('running data retention policy enforcement service')

  await pruneBatches()
  await pruneComparisonResults()
}
