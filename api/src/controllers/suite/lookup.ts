// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'

import { ComparisonFunctions } from '@/controllers/comparison'
import { BatchModel } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import type { BatchItemQueryOutput } from '@/types/backendtypes'
import { ENotificationType, SuiteLookupResponse } from '@touca/api-schema'
import logger from '@/utils/logger'
import { rclient as redis } from '@/utils/redis'

/**
 * Provides information about a given suite.
 */
async function suiteLookup(
  user: IUser,
  team: ITeam,
  suite: ISuiteDocument
): Promise<SuiteLookupResponse> {
  // find list of batches that belong to this suite, sorted in descending
  // order of their submission time. We use this list to populate some of
  // the fields in our response.

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
      $project: {
        _id: 1,
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
        updatedAt: 1
      }
    }
  ])

  // prepare a draft of our response with fields that depend on existence of
  // batches, set to undefined or empty array.

  const output: SuiteLookupResponse = {
    baseline: undefined,
    batches: [],
    batchCount: queryOutput.length,
    isSubscribed: suite.subscribers.includes(user._id),
    latest: undefined,
    overview: undefined,
    promotions: [],
    retainFor: suite.retainFor,
    sealAfter: suite.sealAfter,
    subscriberCount: suite.subscribers.length,
    subscription:
      suite.subscriptions.find((v) => v.user._id.equals(user._id))?.level ||
      ENotificationType.None,
    suiteName: suite.name,
    suiteSlug: suite.slug,
    teamName: team.name,
    teamSlug: team.slug
  }

  // in the special case when suite has no batch, return output without
  // fields that depend on existence of batches.

  if (queryOutput.length === 0) {
    return output
  }

  // in another special case when suite has no baseline, assume that suite
  // is in the process of being removed and return output without fields
  // that depend on existence of batches. when we are asked to remove a
  // suite, we clear its `promotions` field to enable removal of all of
  // its batches.

  if (suite.promotions.length === 0) {
    logger.info('%s/%s: has batches but has no baseline', team.slug, suite.slug)
    return output
  }

  // in more common cases, proceed with computing information about
  // baseline, latest and overview fields.

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  const batchLatest = queryOutput[0]
  const batchBaseline = queryOutput.find((v) => v._id.equals(baselineInfo.to))
  const overview =
    batchLatest.meta ??
    (await ComparisonFunctions.compareBatchOverview(
      batchBaseline._id,
      batchLatest._id
    ))

  const promoterIds = [...new Set(suite.promotions.map((raw) => raw.by))]
  const promoters = await UserModel.find(
    { _id: { $in: promoterIds } },
    { _id: 1, username: 1, fullname: 1 }
  )

  // known defect: when batch is expired, we remove its corresponding doc from
  // database but never update the "promotions" field in the "suites" collection
  // which leaves references to the removed batch that cannot be resolved.
  // our remedy for now is to null check for invalid references and remove
  // promotion events wih missing `from` or `to` fields. But this is just to
  // prevent crashes. The right approach is to fix data retention logic.
  output.promotions = suite.promotions
    .map((raw) => ({
      at: raw.at,
      by: pick(
        promoters.find((v) => v._id.equals(raw.by)),
        ['username', 'fullname']
      ),
      for: raw.for,
      from: queryOutput.find((v) => v._id.equals(raw.from))?.batchSlug,
      to: queryOutput.find((v) => v._id.equals(raw.to))?.batchSlug
    }))
    .filter((v) => v.from && v.to)

  output.promotions.forEach((v: any) => delete v.by._id)
  queryOutput.forEach((v) => delete v._id)
  delete batchLatest._id
  delete batchLatest.meta
  delete batchBaseline._id
  delete batchBaseline.meta

  output.batches = queryOutput.map((v) => v.batchSlug)
  output.latest = batchLatest
  output.baseline = batchBaseline
  output.overview = overview
  return output
}

export async function ctrlSuiteLookup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: looking up suite', user.username, tuple)
  const cacheKey = `route_suiteLookup_${tuple}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await redis.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redis.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await suiteLookup(user, team, suite)

  // cache lookup result

  redis.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
