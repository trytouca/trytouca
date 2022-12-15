// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { insertEvent } from '../queues/events.js'
import {
  BatchModel,
  CommentModel,
  ISuiteDocument,
  ITeam,
  IUser,
  SuiteModel,
  TeamModel
} from '../schemas/index.js'
import { logger, redisClient } from '../utils/index.js'
import { batchRemove } from './batch.js'

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
    subscriptions: [{ user: user._id, level: 'all' }],
    team: team._id
  })

  logger.info('%s: created suite %s/%s', user.username, team.slug, suite.slug)

  // remove information about the list of known suites from cache.
  // we intentionally wait for this operation to avoid race conditions
  await redisClient.removeCached(
    `route_suiteList_${team.slug}_${user.username}`
  )

  insertEvent({
    type: 'suite:created',
    teamId: team._id,
    suiteId: newSuite._id,
    batchId: undefined
  })

  return newSuite
}

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

    redisClient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
    redisClient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
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
