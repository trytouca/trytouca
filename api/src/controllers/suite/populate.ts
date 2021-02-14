/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { BatchModel } from '../../schemas/batch'
import { ISuiteDocument } from '../../schemas/suite'
import { ITeam } from '../../schemas/team'
import { IUser } from '../../schemas/user'
import logger from '../../utils/logger'

/**
 * subscribe user to a given suite.
 */
export async function ctrlSuitePopulate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: populating suite %s with sample data', user._id, tuple)

  // reject request if suite already has data

  if (await BatchModel.countDocuments({ suite: suite._id })) {
    return next({
      errors: ['suite not empty'],
      status: 409
    })
  }

  return res.status(204).send()
}
