// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { batchSeal } from '../models/batch.js'
import { BatchModel } from '../schemas/batch.js'
import { SuiteModel } from '../schemas/suite.js'
import { TeamModel } from '../schemas/team.js'
import logger from '../utils/logger.js'

export async function autosealService(): Promise<void> {
  logger.silly('auto-seal service: running')
  for (const team of await TeamModel.find()) {
    for (const suite of await SuiteModel.find({ team: team._id })) {
      const threshold = new Date()
      threshold.setSeconds(threshold.getSeconds() - suite.sealAfter)

      const batches = await BatchModel.aggregate([
        {
          $match: {
            suite: suite._id,
            sealedAt: { $exists: false },
            updatedAt: { $lt: threshold }
          }
        },
        { $project: { elements: false } }
      ])

      for (const batch of batches) {
        const tuple = [team.slug, suite.slug, batch.slug].join('/')
        logger.info('auto-seal service: sealing %s', tuple)
        await batchSeal(team, suite, batch)
      }
    }
  }
}
