// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
// to be removed as part of "Synchronized Comparison" project

import { NextFunction, Request, Response } from 'express'

import { updateComparisonStats } from '@/models/comparison'

export async function comparisonStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const stats = req.body as {
    avgCollectionTime: number
    avgProcessingTime: number
    numCollectionJobs: number
    numProcessingJobs: number
  }
  await updateComparisonStats(stats)
  return res.status(204).send()
}
