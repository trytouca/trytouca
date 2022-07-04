// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ComparisonModel, IComparisonDocument } from '@/schemas/comparison'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

/**
 * @todo validate incoming json data against a json schema
 */
export async function comparisonProcess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jobId = req.params.job
  const input = req.body as {
    overview: IComparisonDocument['meta']
    body: Record<string, unknown>
  }

  // we expect that comparison job exists

  const comparison = await ComparisonModel.findById(jobId)
  if (!comparison) {
    return next({
      errors: ['comparison job not found'],
      status: 404
    })
  }

  // we expect that comparison job is not already processed

  if (comparison.contentId) {
    return next({
      errors: ['comparison job already processed'],
      status: 409
    })
  }

  // insert comparison result in json format into object storage database

  const doc = await objectStore.addComparison(
    comparison._id.toHexString(),
    JSON.stringify(input.body, null)
  )
  if (!doc) {
    return next({
      errors: ['failed to handle comparison result'],
      status: 500
    })
  }

  // mark comparison job as processed

  await ComparisonModel.findByIdAndUpdate(jobId, {
    $set: {
      processedAt: new Date(),
      contentId: comparison._id,
      meta: input.overview
    },
    $unset: { reservedAt: true }
  })

  logger.debug('%s: processed comparison job', jobId)
  return res.status(204).send()
}
