// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { elementListBaseline } from '../../models/index.js'
import { ISuiteDocument, ITeam, IUser } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function clientElementList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: listing baseline elements', user.username, tuple)
  const output = await elementListBaseline(suite)
  return res.status(200).json(output)
}
