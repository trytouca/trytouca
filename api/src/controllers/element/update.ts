// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'

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

  const allowed = ['note', 'tags']
  const setProps = pick(req.body, allowed)
  const missingKeys = allowed.filter((v) => !Object.keys(setProps).includes(v))
  const action = {
    set: setProps,
    unset: Object.fromEntries(missingKeys.map((v) => [v, '']))
  }

  await ElementModel.findOneAndUpdate(
    { _id: element._id },
    { $set: action.set }
  )
  await ElementModel.findOneAndUpdate(
    { _id: element._id },
    { $unset: action.unset }
  )

  logger.info('%s: updated element %s: %j', user.username, tuple, action)
  return res.status(204).json()
}
