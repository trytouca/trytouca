// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { comparisonProcess } from '@/models/comparison'

/**
 * @todo validate incoming json data against a json schema
 */
export async function comparisonProcessCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await comparisonProcess(req.params.job, req.body)
  } catch (err) {
    return res.status(500).json({ errors: [err.message] })
  }
  return res.status(204).send()
}
