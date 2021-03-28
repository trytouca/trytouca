/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { SuiteModel } from '@weasel/schemas/suite'
import { ITeam } from '@weasel/schemas/team'
import logger from '@weasel/utils/logger'

/**
 * @summary
 * Checks if a suite exists in a team.
 *
 * @description
 * Checks if a suite whose slug is specified in request parameter
 * as `suite` exists in a team `team`.
 *
 * - Populates local response variables: `suite`.
 * - Expects request parameters: `suite`
 * - Expects local response variables: `team`
 * - Database Queries: 1
 *
 * @returns
 * - Error 404 if suite (`suite`) does not exist in team `team`.
 */
export async function hasSuite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const suiteSlug = req.params.suite
  const tuple = [team.slug, suiteSlug]

  const suite = await SuiteModel.findOne({ slug: suiteSlug, team: team._id })

  // return 404 if suite with specified name does not exist

  if (!suite) {
    return next({
      errors: ['suite not found'],
      status: 404
    })
  }

  logger.silly('%s: suite exists', tuple.join('/'))
  res.locals.suite = suite
  return next()
}
