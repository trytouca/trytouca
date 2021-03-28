/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { batchRemove } from '@weasel/models/batch'
import { BatchModel } from '@weasel/schemas/batch'
import { CommentModel } from '@weasel/schemas/comment'
import { ISuiteDocument, SuiteModel } from '@weasel/schemas/suite'
import { ITeam, TeamModel } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'

/**
 *
 */
export async function suiteCreate(
  user: IUser,
  team: ITeam,
  suite: { slug: string; name: string }
): Promise<ISuiteDocument> {
  // check that suite slug is available

  if (await SuiteModel.countDocuments({ team: team._id, slug: suite.slug })) {
    return
  }

  // register suite in database

  const newSuite = await SuiteModel.create({
    createdBy: user._id,
    name: suite.name,
    slug: suite.slug,
    subscribers: [user._id],
    team: team._id
  })
  return newSuite
}

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
