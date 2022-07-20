// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { SuiteListResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'

import { ComparisonFunctions } from '@/controllers/comparison'
import { BatchModel } from '@/schemas/batch'
import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import type {
  BatchItemQueryOutput,
  SuiteItemQueryOutput
} from '@/types/backendtypes'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

async function suiteList(team: ITeam): Promise<SuiteListResponse> {
  // find list of suites that belong to this team, sorted in descending
  // order of their creation time.

  const allSuites: ISuiteDocument[] = await SuiteModel.aggregate([
    { $match: { team: team._id } },
    { $sort: { createdAt: -1 } }
  ])

  // find list of all batches that belong to this team, sorted in descending
  // order of their submission time and grouped by the suite they belong to.
  // We use this list to populate some of the fields in our response.

  type BatchQueryOuptut = {
    _id: Types.ObjectId
    batches: BatchItemQueryOutput[]
  }

  const allBatches: BatchQueryOuptut[] = await BatchModel.aggregate([
    { $match: { suite: { $in: allSuites.map((v) => v._id) } } },
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
      $project: {
        batchSlug: '$slug',
        commentCount: { $literal: 0 },
        expirable: 1,
        isSealed: { $cond: [{ $ifNull: ['$sealedAt', false] }, true, false] },
        messageCount: { $size: '$elements' },
        meta: 1,
        submittedAt: 1,
        submittedBy: {
          username: '$submittedByDoc.username',
          fullname: '$submittedByDoc.fullname'
        },
        suiteId: '$suite',
        updatedAt: 1
      }
    },
    { $group: { _id: '$suiteId', batches: { $push: '$$ROOT' } } },
    { $project: { 'batches.suiteId': 0 } }
  ])

  const suiteJobs = allSuites.map(
    async (suite): Promise<SuiteItemQueryOutput> => {
      const output = {
        baseline: undefined,
        batchCount: 0,
        latest: undefined,
        overview: undefined,
        suiteName: suite.name,
        suiteSlug: suite.slug
      }

      const batchQueryOutput = allBatches.find((v) => v._id.equals(suite._id))

      // in the special case when suite has no batch, return output without
      // fields that depend on existance of batches.

      if (!batchQueryOutput) {
        return output
      }

      // in another special case when suite has no baseline, assume that suite
      // is in the process of being removed and return output without fields
      // that depend on existance of batches. when we are asked to remove a
      // suite, we clear its `promotions` field to enable removal of all of
      // its batches.

      if (suite.promotions.length === 0) {
        logger.info(
          '%s/%s: has batches but has no baseline',
          team.slug,
          suite.slug
        )
        return output
      }

      // in more common cases, proceed with computing information about
      // baseline, latest and overview fields.

      const baselineInfo = suite.promotions[suite.promotions.length - 1]

      const batches = batchQueryOutput.batches
      const batchLatest = batches[0]
      const batchBaseline = batches.find((v) => v._id.equals(baselineInfo.to))
      const overview =
        batchLatest.meta ??
        (await ComparisonFunctions.compareBatchOverview(
          batchBaseline._id,
          batchLatest._id
        ))
      delete batchLatest._id
      delete batchLatest.meta
      delete batchBaseline._id
      delete batchBaseline.meta

      output.batchCount = batches.length
      output.latest = batchLatest
      output.baseline = batchBaseline
      output.overview = overview
      return output
    }
  )

  return await Promise.all(suiteJobs)
}

/**
 * @summary
 * Lists all suites in a given team.
 *
 * @description
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 */
export async function ctrlSuiteList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [team.slug].join('_')
  logger.debug('%s: %s: listing suites', user.username, tuple)
  const cacheKey = `route_suiteList_${tuple}_${user.username}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await suiteList(team)

  // cache list result

  rclient.cache(cacheKey, output)

  // log runtime performance before returning

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
