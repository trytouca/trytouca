// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { BatchModel } from '../schemas/batch.js'
import { ISuiteDocument } from '../schemas/suite.js'
import { ITeam } from '../schemas/team.js'
import logger from '../utils/logger.js'

/**
 * @summary
 * Checks if a batch exists in a suite.
 *
 * @description
 * Checks if a batch whose slug is specified in request parameter
 * as `batch` exists for suite `suite` in team `team`.
 *
 * - Populates local response variables: `batch`.
 * - Expects request parameters: `batch`
 * - Expects local response variables: `suite`
 *
 * @returns
 * - Error 404 if batch (`batch`) does not exist in suite `suite`.
 */
export async function hasBatch(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batchSlug = req.params.batch
  const tuple = [team.slug, suite.slug, batchSlug].join('/')

  const batch = await BatchModel.findOne({
    slug: batchSlug,
    suite: suite._id
  })

  // return 404 if batch with specified name does not exist for `suite`

  if (!batch) {
    return next({
      errors: ['batch not found'],
      status: 404
    })
  }

  logger.silly('%s: batch exists', tuple)
  res.locals.batch = batch
  return next()
}
