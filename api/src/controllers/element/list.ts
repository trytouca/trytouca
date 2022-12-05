// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ElementListResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import {
  ISuiteDocument,
  ITeam,
  IUser,
  MessageModel
} from '../../schemas/index.js'
import { logger, redisClient } from '../../utils/index.js'

/**
 * Find list of elements submitted to the baseline version of a given suite.
 *
 * @internal
 */
async function elementListImpl(
  team: ITeam,
  suite: ISuiteDocument
): Promise<ElementListResponse> {
  // return empty list if suite has no version
  if (suite.promotions.length === 0) {
    return []
  }

  // find batch that is set as suite baseline
  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  // find list of batches in which this element was submitted
  const items: ElementListResponse = await MessageModel.aggregate([
    { $match: { batchId: baselineInfo.to } },
    { $sort: { submittedAt: 1 } },
    {
      $lookup: {
        as: 'elementDoc',
        foreignField: '_id',
        from: 'elements',
        localField: 'elementId'
      }
    },
    { $unwind: '$elementDoc' },
    {
      $project: {
        _id: 0,
        metricsDuration: '$meta.metricsDuration',
        name: '$elementDoc.name',
        note: '$elementDoc.note',
        slug: '$elementDoc.slug',
        tags: '$elementDoc.tags',
        versions: []
      }
    }
  ])
  return items
}

/**
 * @summary
 * List all elements submitted to the baseline version of a given suite.
 *
 * @description
 * This function is designed to be called after the following middleware:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *
 * Caches returned output.
 */
export async function elementList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: listing elements', user.username, tuple)
  const cacheKey = `route_elementList_${tuple}`
  const tic = process.hrtime()

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  const output = await elementListImpl(team, suite)

  redisClient.cache(cacheKey, output)
  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
