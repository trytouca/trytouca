/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { MessageModel } from '@weasel/schemas/message'
import { ISuiteDocument } from '@weasel/schemas/suite'
import { ITeam } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import type { ElementListResponse } from '@weasel/types/commontypes'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'
import { NextFunction, Request, Response } from 'express'

/**
 * Find list of elements submitted to the baseline version of a given suite.
 *
 * @internal
 */
async function elementListImpl(
  team: ITeam,
  suite: ISuiteDocument
): Promise<ElementListResponse> {
  // find batch that is set as suite baseline

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  // find list of batches in which this element was submitted

  const result = await MessageModel.aggregate([
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
        name: '$elementDoc.name'
      }
    }
  ])

  return result
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
 *
 * Database Queries: 1
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

  // return result from cache in case it is available

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await elementListImpl(team, suite)

  // cache list result

  rclient.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
