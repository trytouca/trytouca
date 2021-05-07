/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ComparisonFunctions } from '@weasel/controllers/comparison'
import { BatchModel, IBatchDocument } from '@weasel/schemas/batch'
import { ElementModel, IElementDocument } from '@weasel/schemas/element'
import { MessageModel } from '@weasel/schemas/message'
import { ISuiteDocument, SuiteModel } from '@weasel/schemas/suite'
import { ITeam } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import type { BackendBatchComparisonItemCommon } from '@weasel/types/backendtypes'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as minio from '@weasel/utils/minio'
import { rclient } from '@weasel/utils/redis'
import { NextFunction, Request, Response } from 'express'

/**
 *
 */
type ICompareParamsElement = {
  dstSuite?: ISuiteDocument
  dstBatch?: IBatchDocument
  dstElement?: IElementDocument
  srcSuite?: ISuiteDocument
  srcBatch?: IBatchDocument
  srcElement?: IElementDocument
}

/**
 *
 */
function cleanOutput(output: BackendBatchComparisonItemCommon): void {
  delete output.src.contentId
  delete output.src.messageId
  delete output.dst.contentId
  delete output.dst.messageId
  delete output.contentId
}

/**
 * @summary
 * Compares two messages submitted for the same element in two batches.
 *
 * @description
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasElement` to yield `element`
 *  - `hasBatch` to yield `batch`
 *
 * - Database Queries: Unknown
 */
export async function elementCompare(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const element = res.locals.element as IElementDocument
  const tic = process.hrtime()

  const names: { [k: string]: string } = {
    dstBatch: req.params.dstBatch,
    dstElement: req.params.dstElement,
    dstSuite: req.params.dstSuite,
    srcBatch: batch.slug,
    srcElement: element.name,
    srcSuite: suite.slug
  }
  const cacheKey =
    `route_elementCompare_${team.slug}_` + Object.values(names).join('_')

  // return comparison result from cache in case it is available

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  const params: ICompareParamsElement = {
    srcSuite: suite,
    srcBatch: batch,
    srcElement: element
  }

  // return 404 if base suite with specified name does not exist

  if (names.dstSuite === names.srcSuite) {
    params.dstSuite = params.srcSuite
  } else {
    params.dstSuite = await SuiteModel.findOne(
      { slug: names.dstSuite },
      { _id: 1 }
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
      { _id: 1 }
    )
    if (!params.dstBatch) {
      return next({
        errors: ['dst batch not found'],
        status: 404
      })
    }
  }

  // return 404 if base element with specified name does not exist

  if (
    names.dstElement === names.srcElement &&
    names.dstSuite === names.srcSuite
  ) {
    params.dstElement = params.srcElement
  } else {
    params.dstElement = await ElementModel.findOne(
      { name: names.dstElement, suiteId: params.dstSuite._id },
      { _id: 1 }
    )
    if (!params.dstElement) {
      return next({
        errors: ['dst element not found'],
        status: 404
      })
    }
  }

  // return 404 if head element does not belong to head batch

  const doesBatchHaveElement = (batchId, elementId) => {
    return BatchModel.countDocuments({
      _id: batchId,
      elements: { $elemMatch: { $eq: elementId } }
    })
  }

  if (!(await doesBatchHaveElement(params.srcBatch.id, params.srcElement.id))) {
    return next({
      errors: ['src element missing from batch'],
      status: 404
    })
  }

  // return 404 if base element does not belong to base batch

  if (!(await doesBatchHaveElement(params.dstBatch.id, params.dstElement.id))) {
    return next({
      errors: ['dst element missing from batch'],
      status: 404
    })
  }

  // compare the two messages

  const headName = [names.srcSuite, names.srcElement, names.srcBatch].join('/')
  const baseName = [names.dstSuite, names.dstElement, names.dstBatch].join('/')
  logger.debug('%s: comparing %s with %s', user.username, headName, baseName)

  // find messages submitted for each element/batch pair

  const getMessage = async (batchId, elementId) =>
    MessageModel.findOne(
      { batchId, elementId },
      {
        builtAt: 1,
        contentId: 1,
        elementId: 1,
        submittedAt: 1,
        submittedBy: 1
      }
    )
      .populate({ path: 'elementId', select: 'name' })
      .populate({ path: 'submittedBy', select: '-_id fullname username' })

  const srcMessage = await getMessage(params.srcBatch.id, params.srcElement.id)
  const dstMessage = await getMessage(params.dstBatch.id, params.dstElement.id)

  // create a common element object between two messages

  const convert = async (msg) => {
    return {
      builtAt: msg.builtAt,
      contentId: msg.contentId,
      elementName: msg.elementId.name,
      messageId: msg._id,
      submittedAt: msg.submittedAt,
      submittedBy: msg.submittedBy
    }
  }

  const output: BackendBatchComparisonItemCommon = {
    dst: await convert(dstMessage),
    src: await convert(srcMessage)
  }

  // perform comparison between the two messages, update the output
  // with its comparison result, and cache comparison result to avoid
  // reprocessing this request in the near future.

  return ComparisonFunctions.compareCommonElement(
    params.dstBatch._id,
    params.srcBatch._id,
    output
  )
    .then(async () => {
      const isProcessed = output.contentId
      if (isProcessed) {
        output.cmp = JSON.parse(await minio.getComparison(output.contentId))
        logger.info(
          '%s: compared %s with %s',
          user.username,
          headName,
          baseName
        )
      }

      // remove backend-specific information that may have been needed during
      // processing but should not be exposed to the user.

      cleanOutput(output)

      // cache message comparison result if it is processed.

      if (isProcessed) {
        const duration = config.redis.durationLong
        rclient.cache(cacheKey, output, duration)
      }

      const toc = process
        .hrtime(tic)
        .reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
      logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
      return res.status(200).json(output)
    })
    .catch((err) => {
      return next({ errors: [err], status: 503 })
    })
}
