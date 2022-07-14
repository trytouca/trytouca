// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { MessageModel } from '@/schemas/message'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import type { ElementListResponse } from '@touca/api-schema'
import logger from '@/utils/logger'
import { rclient as redis } from '@/utils/redis'

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
  return await MessageModel.aggregate([
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
        slug: '$elementDoc.slug'
      }
    }
  ])
}

/**
 * @summary
 * List all elements submitted to the baseline version of a given suite.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *
 * Caches returned output.
 */
export async function clientElementList(
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

  if (await redis.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redis.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  const output = await elementListImpl(team, suite)

  redis.cache(cacheKey, output)
  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
