/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { createUserSession } from '@weasel/models/auth'
import { UserModel } from '@weasel/schemas/user'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import { tracker } from '@weasel/utils/tracker'
import { NextFunction, Request, Response } from 'express'

/**
 *
 */
export async function authVerifyActivate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const activationKey = req.params.key
  const askedAgent = req.headers['user-agent']
  const askedIpAddress = req.ip
  logger.debug('received request to activate user')

  // return 400 if activation key is invalid

  if (activationKey.length !== config.auth.activationKeyLength) {
    return next({
      errors: ['invalid activation key'],
      status: 400
    })
  }

  // check if activation key is associated with any inactive user

  const user = await UserModel.findOneAndUpdate(
    { activationKey },
    {
      $set: { activatedAt: new Date() },
      $unset: { activationKey: true }
    }
  )

  // return 404 if activation key is not found

  if (!user) {
    return next({
      errors: ['activation key not found'],
      status: 404
    })
  }

  // now that we activated this account, we acquire a session for the user
  // so they don't have to sign in.

  logger.info('%s: verified account', user.username)
  const session = await createUserSession(user, { askedAgent, askedIpAddress })

  // add event to tracking system

  tracker.track(user, 'activated_account')

  // return session token to the user
  // @todo consider setting path and secure attributes

  res.cookie('authToken', session.token, {
    expires: session.expiresAt,
    httpOnly: true,
    path: '/',
    secure: false,
    signed: true
  })
  return res.status(200).json({ expiresAt: session.expiresAt })
}
