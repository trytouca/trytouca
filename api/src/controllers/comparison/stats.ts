/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { MetaModel } from '@/schemas/meta'
import logger from '@/utils/logger'

/**
 *
 */
export async function comparisonStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const input = req.body as {
    avgCollectionTime: number
    avgProcessingTime: number
    numCollectionJobs: number
    numProcessingJobs: number
  }

  logger.debug('received comparison statistics: %j', input)

  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
  }

  const meta = await MetaModel.findOne()

  if (0 < input.numCollectionJobs) {
    const jobs = meta.cmpNumCollectionJobs + input.numCollectionJobs
    const previous = meta.cmpAvgCollectionTime * meta.cmpNumCollectionJobs
    const incoming = input.avgCollectionTime * input.numCollectionJobs
    meta.cmpAvgCollectionTime = (previous + incoming) / jobs
    meta.cmpNumCollectionJobs += input.numCollectionJobs
  }

  if (0 < input.numProcessingJobs) {
    const jobs = meta.cmpNumProcessingJobs + input.numProcessingJobs
    const previous = meta.cmpAvgProcessingTime * meta.cmpNumProcessingJobs
    const incoming = input.avgProcessingTime * input.numProcessingJobs
    meta.cmpAvgProcessingTime = (previous + incoming) / jobs
    meta.cmpNumProcessingJobs += input.numProcessingJobs
  }

  await MetaModel.updateOne({}, { $set: meta })
  logger.info('updated comparison statistics', input)

  return res.status(204).send()
}
