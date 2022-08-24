// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { getComparisonJobs } from '@/models/comparison'

export async function comparisonList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jobs = await getComparisonJobs()
  return res.status(200).json(jobs)
}
