// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ENotificationType } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { ISuiteDocument, SuiteModel } from '../../schemas/suite.js'
import { ITeam } from '../../schemas/team.js'
import { IUser } from '../../schemas/user.js'
import logger from '../../utils/logger.js'
import { redisClient } from '../../utils/redis.js'
import { analytics, EActivity } from '../../utils/tracker.js'

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

  if (level !== 'none') {
    await SuiteModel.findByIdAndUpdate(suite._id, {
      $push: { subscriptions: { user: user._id, level } }
    })
  }

  analytics.add_activity(EActivity.SuiteSubscribed, user, {
    suite: tuple,
    level: level
  })
  logger.info('%s: subscribed to %s (%s)', user.username, tuple, level)

  await redisClient.removeCached(`route_suiteLookup_${tuple}`)
  return res.status(204).send()
}
