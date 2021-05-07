/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ISuiteDocument, SuiteModel } from '@weasel/schemas/suite'
import { ITeam } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { NextFunction, Request, Response } from 'express'

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
  logger.info('%s: subscribed to %s', user.username, tuple)

  return res.status(204).send()
}
