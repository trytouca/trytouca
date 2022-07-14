// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { BatchLookupResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { ComparisonFunctions } from '@/controllers/comparison'
import { UserMap } from '@/models/usermap'
import { BatchModel, IBatchDocument } from '@/schemas/batch'
import { CommentModel } from '@/schemas/comment'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { ECommentType } from '@/types/backendtypes'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

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
    batch.meta ??
    (await ComparisonFunctions.compareBatchOverview(batch.superior, batch._id))

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
    submittedAt: batch.submittedAt,
    submittedBy: userMap.getGroup('submittedBy'),
    suiteName: suite.name,
    suiteSlug: suite.slug,
    teamName: team.name,
    teamSlug: team.slug,
    updatedAt: batch.updatedAt
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

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await batchLookup(team, suite, batch)

  // cache lookup result

  rclient.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
