// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { tracker } from '@/utils/tracker'

/**
 * subscribe user to a given suite.
 */
export async function suiteSubscribe(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: subscribing to %s', user.username, tuple)

  // we are done if user is already subscribed

  if (suite.subscribers.includes(user._id)) {
    logger.info('%s: already subscribed to %s', user.username, tuple)
    return res.status(204).send()
  }

  // otherwise subscribe the user

  await SuiteModel.findByIdAndUpdate(
    { _id: suite._id },
    { $push: { subscribers: user._id } }
  )
  tracker.track(user, 'subscribe', { suite: tuple })
  logger.info('%s: subscribed to %s', user.username, tuple)

  return res.status(204).send()
}
