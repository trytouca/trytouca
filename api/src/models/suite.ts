/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { batchRemove } from '../models/batch'
import { BatchModel } from '../schemas/batch'
import { CommentModel } from '../schemas/comment'
import { SuiteModel, ISuiteDocument } from '../schemas/suite'
import { TeamModel } from '../schemas/team'
import { rclient } from '../utils/redis'
import logger from '../utils/logger'

/**
 *
 */
export async function suiteRemove(suite: ISuiteDocument): Promise<boolean> {
  const team = await TeamModel.findById(suite.team)
  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: considering removal', tuple)

  // in less common case, the user may have registered the suite
  // without submitting results to it which allows us to remove the
  // suite instantly.

  if (0 === (await BatchModel.countDocuments({ suite: suite._id }))) {
    await CommentModel.deleteMany({ suiteId: suite._id })
    await SuiteModel.findByIdAndRemove(suite._id)
    logger.info('%s: removed', tuple)

    rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
    rclient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
    return true
  }

  await SuiteModel.findByIdAndUpdate(suite._id, {
    $set: { promotions: [] }
  })

  const batches = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } }
  ])

  logger.debug('%s: removing %d batches', tuple, batches.length)

  let removed = true
  for (const batch of batches) {
    removed = removed && (await batchRemove(batch))
  }

  return removed
}
