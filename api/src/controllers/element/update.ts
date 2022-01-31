// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ElementModel, IElementDocument } from '@/schemas/element'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'

/**
 * Update metadata of a given element.
 */
export async function elementUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const element = res.locals.element as IElementDocument
  const tuple = [team.slug, suite.slug, element.slug].join('/')
  const proposed = req.body as {
    note: string
    tags: string[]
  }
  logger.debug('%s: updating element %s: %j', user.username, tuple, proposed)

  await ElementModel.findOneAndUpdate({ _id: element._id }, { $set: proposed })

  logger.info('%s: updated element %s: %j', user.username, tuple, proposed)
  return res.status(204).json()
}
