// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { ComparisonFunctions } from '@/controllers/comparison'
import { BatchModel, IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeamDocument, TeamModel } from '@/schemas/team'
import logger from '@/utils/logger'
import { redisClient } from '@/utils/redis'

async function populateBatchMeta(
  team: ITeamDocument,
  suite: ISuiteDocument,
  batch: IBatchDocument
) {
  const serviceName = 'service analytics'
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  logger.info('%s: %s: comparing to baseline', serviceName, tuple)

  const overview = await ComparisonFunctions.compareBatchOverview(
    batch.superior,
    batch._id
  )

  if (overview.elementsCountPending) {
    logger.info('%s: %s: skipped: has pending elements', serviceName, tuple)
    return
  }

  await BatchModel.findByIdAndUpdate(batch._id, { meta: overview })
  logger.info('%s: %s: updated comparison metadata', serviceName, tuple)

  redisClient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}`)
}

async function processSuite(team: ITeamDocument, suite: ISuiteDocument) {
  await BatchModel.find({
    suite: suite._id,
    sealedAt: { $exists: true },
    meta: { $exists: false }
  })
    .sort({ submittedAt: 1 })
    .cursor()
    .eachAsync(
      (batch: IBatchDocument) => populateBatchMeta(team, suite, batch),
      { parallel: 1 }
    )
}

export async function analyticsService(): Promise<void> {
  logger.silly('analytics service: running')

  const teams = await TeamModel.find()
  for (const team of teams) {
    await SuiteModel.find({ team: team._id })
      .sort({ updatedAt: 1 })
      .cursor()
      .eachAsync((v: ISuiteDocument) => processSuite(team, v), { parallel: 1 })
  }
}
