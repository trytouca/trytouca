// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { ENotificationType } from '@/types/commontypes'
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
  const level: ENotificationType = req.body.level
  logger.debug('%s: subscribing to %s (%s)', user.username, tuple, level)

  await SuiteModel.findByIdAndUpdate(suite._id, {
    $pull: { subscriptions: { user: user._id } }
  })

  if (level !== ENotificationType.None) {
    await SuiteModel.findByIdAndUpdate(suite._id, {
      $push: { subscriptions: { user: user._id, level } }
    })
  }

  tracker.track(user, 'subscribe', { suite: tuple, level: level })
  logger.info('%s: subscribed to %s (%s)', user.username, tuple, level)

  return res.status(204).send()
}
