// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { compareBatch } from '../../models/comparison.js'
import {
  BatchModel,
  IBatchDocument,
  ISuiteDocument,
  ITeam,
  IUser,
  SuiteModel
} from '../../schemas/index.js'
import {
  BackendBatchComparisonItem,
  BackendBatchComparisonResponse
} from '../../types/backendtypes.js'
import { config, logger, redisClient } from '../../utils/index.js'

type ICompareParamsBatch = {
  dstSuite?: ISuiteDocument
  dstBatch?: IBatchDocument
  srcSuite: ISuiteDocument
  srcBatch: IBatchDocument
}

/**
 * if all elements are processed, cache comparison result to avoid
 * reprocessing this request in the near future.
 * if head and base versions are both sealed, the output is not subject
 * to change in which case we can cache it for a much longer time.
 */
function cleanOutput(output: BackendBatchComparisonResponse): void {
  const cleanCmpElement = (cmp: BackendBatchComparisonItem) => {
    delete cmp.contentId
    delete cmp.messageId
  }

  output.fresh.map(cleanCmpElement)
  output.missing.map(cleanCmpElement)
  output.common.map((cmp) => {
    cleanCmpElement(cmp.dst)
    cleanCmpElement(cmp.src)
    delete cmp.contentId
  })
}

/**
 * @summary
 * Compares a batch with another batch.
 *
 * @description
 * We allow the user to omit specifying base suite in which case we
 * compare this batch with the base batch of this same suite.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasBatch` to yield `batch`
 */
export async function batchCompare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const tic = process.hrtime()

  // construct a unique identifier from comparison parameters to be used as
  // cache key. Note that the order really matters here. We want the cacheKey
  // to start with src suite and batch so we can remove all cached results
  // when src suite or batch is removed.

  const names: { [k: string]: string } = {
    srcSuite: suite.slug,
    srcBatch: batch.slug,
    dstSuite: req.params.dstSuite,
    dstBatch: req.params.dstBatch
  }
  const cacheKey =
    `route_batchCompare_${team.slug}_` + Object.values(names).join('_')

  // return comparison result from cache in case it is available

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // Note that we have already validated `srcSuite` and `srcBatch`.
  // But `dstBatch` and `dstSuite` need to be validated. We need to
  // check that 1) `dstSuite` exists and 2) it has a batch `dstBatch`.

  const params: ICompareParamsBatch = { srcSuite: suite, srcBatch: batch }

  // return 404 if base suite with specified name does not exist

  if (names.dstSuite === names.srcSuite) {
    params.dstSuite = params.srcSuite
  } else {
    params.dstSuite = await SuiteModel.findOne(
      { slug: names.dstSuite },
      { _id: 1, slug: 1 }
    )
    if (!params.dstSuite) {
      return next({
        errors: ['dst suite not found'],
        status: 404
      })
    }
  }

  // return 404 if base batch with specified name does not exist

  if (names.dstSuite === names.srcSuite && names.dstBatch === names.srcBatch) {
    params.dstBatch = params.srcBatch
  } else {
    params.dstBatch = await BatchModel.findOne(
      { slug: names.dstBatch, suite: params.dstSuite._id },
      { _id: 1, slug: 1, sealedAt: 1 }
    )
    if (!params.dstBatch) {
      return next({
        errors: ['dst batch not found'],
        status: 404
      })
    }
  }

  // compare the two batches

  try {
    const headName = [params.srcSuite.slug, params.srcBatch.slug].join('/')
    const baseName = [params.dstSuite.slug, params.dstBatch.slug].join('/')

    const output = await compareBatch(params.dstBatch._id, params.srcBatch._id)
    logger.info('compared %s with %s', headName, baseName)

    // check if all elements are processed. Since we rely on field `contentId`,
    // this check must be done prior to cleanup of the output.

    const isProcessed = output.common.every((v) => v.contentId)

    // remove backend-specific information that may have been needed during
    // processing but should not be exposed to the user.

    cleanOutput(output)

    // cache batch comparison result if all elements are processed.

    if (isProcessed) {
      const isSealed = (batch: IBatchDocument) => Boolean(batch.sealedAt)
      const isFixed = isSealed(params.dstBatch) && isSealed(params.srcBatch)
      const duration = isFixed
        ? config.redis.durationLong
        : config.redis.durationShort
      redisClient.cache(cacheKey, output, duration)
    }

    const toc = process
      .hrtime(tic)
      .reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
    logger.debug('%s: handled request in %s ms', cacheKey, toc.toFixed(0))
    return res.status(200).json(output)
  } catch (err) {
    return next({ errors: [err], status: 503 })
  }
}
