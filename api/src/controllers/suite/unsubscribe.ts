// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { tracker } from '@/utils/tracker'

/**
 * unsubscribe user from a given suite
 */
export async function suiteUnsubscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: unsubscribing from %s', user.username, tuple)

  // we are done if user was never subscribed yet

  if (!suite.subscribers.includes(user._id)) {
    logger.info('%s: not subscribed to %s', user.username, tuple)
    return res.status(204).send()
  }

  // otherwise unsubscribe user

  await SuiteModel.findByIdAndUpdate(
    { _id: suite._id },
    { $pull: { subscribers: user._id } }
  )
  tracker.track(user, 'unsubscribe', { suite: tuple })
  logger.info('%s: unsubscribed from %s', user.username, tuple)

  return res.status(204).send()
}
