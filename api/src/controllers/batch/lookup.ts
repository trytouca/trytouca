// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { BatchLookupResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { compareBatchOverview, UserMap } from '../../models/index.js'
import {
  BatchModel,
  CommentModel,
  IBatchDocument,
  ISuiteDocument,
  ITeam,
  IUser
} from '../../schemas/index.js'
import { ECommentType } from '../../types/index.js'
import { logger, redisClient } from '../../utils/index.js'

/**
 * Provides information about a given batch.
 */
async function batchLookup(
  team: ITeam,
  suite: ISuiteDocument,
  batch: IBatchDocument
): Promise<BatchLookupResponse> {
  const superior = await BatchModel.findOne(
    { _id: batch.superior },
    { _id: 0, slug: 1 }
  )

  const userMap = await new UserMap()
    .addGroup('submittedBy', batch.submittedBy)
    .populate()

  const overview =
    batch.meta ?? (await compareBatchOverview(batch.superior, batch._id))

  const commentCount = await CommentModel.countDocuments({
    type: ECommentType.Batch,
    batchId: batch._id
  })

  return {
    batchSlug: batch.slug,
    commentCount,
    comparedAgainst: superior.slug,
    expirable: batch.expirable,
    isSealed: batch.sealedAt ? true : false,
    messageCount: batch.elements.length,
    meta: overview,
    submittedAt: batch.submittedAt as unknown as string,
    submittedBy: userMap.getGroup('submittedBy'),
    suiteName: suite.name,
    suiteSlug: suite.slug,
    teamName: team.name,
    teamSlug: team.slug,
    updatedAt: batch.updatedAt as unknown as string
  }
}

export async function ctrlBatchLookup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const tuple = [team.slug, suite.slug, batch.slug].join('_')
  logger.debug('%s: %s: looking up batch', user.username, tuple)
  const cacheKey = `route_batchLookup_${tuple}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await batchLookup(team, suite, batch)

  // cache lookup result

  redisClient.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
