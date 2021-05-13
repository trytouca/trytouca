/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { IElementDocument } from '@/schemas/element'
import { MessageModel } from '@/schemas/message'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import type { ElementLookupResponse } from '@/types/commontypes'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

/**
 * Lookup detailed information about an element.
 *
 * @internal
 */
async function elementLookupImpl(
  team: ITeam,
  suite: ISuiteDocument,
  element: IElementDocument
): Promise<ElementLookupResponse> {
  // find list of batches in which this element was submitted

  const result = await MessageModel.aggregate([
    { $match: { elementId: element._id } },
    {
      $lookup: {
        as: 'batchDoc',
        foreignField: '_id',
        from: 'batches',
        localField: 'batchId'
      }
    },
    {
      $group: {
        _id: 'batchId',
        batches: {
          $push: {
            slug: { $arrayElemAt: ['$batchDoc.slug', 0] },
            submittedAt: { $arrayElemAt: ['$batchDoc.submittedAt', 0] },
            updatedAt: { $arrayElemAt: ['$batchDoc.updatedAt', 0] }
          }
        }
      }
    },
    { $project: { _id: 0, batches: 1 } }
  ])

  // provide information related to this element

  return {
    batches: result[0].batches,
    elementName: element.name,
    elementSlug: element.name,
    suiteName: suite.name,
    suiteSlug: suite.slug,
    teamName: team.name,
    teamSlug: team.slug
  }
}

/**
 * @summary
 * Learn more about an element of a given suite.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasElement` to yield `element`
 *
 * Caches output returned for each user.
 */
export async function elementLookup(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const element = res.locals.element as IElementDocument
  const tuple = [team.slug, suite.slug, element.name]
  logger.silly('%s: %s: looking up element', user.username, tuple.join('/'))
  const cacheKey = 'route_elementLookup_' + tuple.join('_')

  // return result from cache in case it is available

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await elementLookupImpl(team, suite, element)

  // cache lookup result if there were any

  rclient.cache(cacheKey, output)
  return res.status(200).json(output)
}
