// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { BatchListResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { compareBatchOverview } from '../../models/index.js'
import {
  BatchModel,
  ISuiteDocument,
  ITeam,
  IUser
} from '../../schemas/index.js'
import type { BatchItemQueryOutput } from '../../types/index.js'
import { logger, redisClient } from '../../utils/index.js'

async function batchList(suite: ISuiteDocument): Promise<BatchListResponse> {
  const queryOutput: BatchItemQueryOutput[] = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'submittedBy',
        foreignField: '_id',
        as: 'submittedByDoc'
      }
    },
    { $unwind: '$submittedByDoc' },
    {
      $lookup: {
        from: 'batches',
        localField: 'superior',
        foreignField: '_id',
        as: 'superiorDoc'
      }
    },
    { $unwind: '$superiorDoc' },
    {
      $project: {
        _id: 1,
        batchSlug: '$slug',
        comparedAgainst: '$superiorDoc.slug',
        expirable: 1,
        isSealed: { $cond: [{ $ifNull: ['$sealedAt', false] }, true, false] },
        messageCount: { $size: '$elements' },
        meta: 1,
        submittedAt: 1,
        submittedBy: {
          username: '$submittedByDoc.username',
          fullname: '$submittedByDoc.fullname'
        },
        superior: 1,
        updatedAt: 1
      }
    }
  ])

  for (const item of queryOutput) {
    if (!item.meta) {
      item.meta = await compareBatchOverview(item.superior, item._id)
    }
    delete item._id
    delete item.superior
  }

  return queryOutput
}

/**
 * @summary
 * List all batches in a given suite.
 *
 * @description
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 */
export async function ctrlBatchList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: listing suites', user.username, tuple)
  const cacheKey = `route_batchList_${tuple}_${user.username}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await batchList(suite)

  // cache list result

  redisClient.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
