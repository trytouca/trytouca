/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import * as bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import ip from 'ip'

import { createUserSession } from '@weasel/models/auth'
import { UserModel } from '@weasel/schemas/user'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'

/**
 *
 */
export async function authSessionCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedPassword = req.body.password
  const askedUsername = req.body.username
  const askedAgent = req.headers['user-agent']
  const askedIpAddress = ip.toLong(req.connection.remoteAddress)
  logger.debug('%s: received request to login user', askedUsername)

  // check if username is associated with any account
  // instead of 404, we return 401 for extra security

  const user = await UserModel.findOne({ username: askedUsername })
  if (!user) {
    logger.debug('rejecting login due to invalid username')
    return next({
      errors: ['invalid login credentials'],
      status: 401
    })
  }

  // return 423 if user is indefinitely suspended

  if (user.suspended) {
    logger.debug('%s: rejecting login of suspended user', user.username)
    return next({
      errors: ['account suspended'],
      status: 423
    })
  }

  // return 423 if user is temporarily locked

  if (user.lockedAt) {
    const lockedUntil = user.lockedAt
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
    if (new Date() < lockedUntil) {
      logger.debug('%s: rejecting login of locked user', user.username)
      return next({
        errors: ['account locked'],
        status: 423
      })
    }
  }

  // generate password hash
  // we perform this operation after checking if user is registered
  // to avoid paying the cost of hash generation in case they are

  const isPasswordValid = await bcrypt.compare(askedPassword, user.password)
  if (!isPasswordValid) {
    logger.debug('%s: failed login attempt for user account', askedUsername)

    // temporarily lock account if user exceeded maximum number of failed
    // login attempts.

    if (config.auth.maxLoginAttempts <= user.loginAttempts) {
      logger.info('%s: temporarily locking user account', askedUsername)
      await UserModel.findByIdAndUpdate(user._id, {
        $set: {
          lockedAt: new Date(),
          loginAttempts: 0
        }
      })

      // notify user that their account was temporarily locked

      mailer.mailUser(
        user,
        'Account Temporarily Locked',
        'auth-signin-user-locked',
        { greetings: user.fullname ? `Hi ${user.fullname}` : `Hello` }
      )
    }

    // otherwise increment number of failed login attempts
    else {
      await UserModel.findByIdAndUpdate(user._id, {
        $inc: { loginAttempts: 1 }
      })
    }

    // return 401 if password was wrong

    return next({
      errors: ['invalid login credentials'],
      status: 401
    })
  }

  // at this point, we recognize user attempt as legitimate and acquire
  // a user session.

  logger.debug('%s: signin request validated', user.username)
  const session = await createUserSession(user, { askedAgent, askedIpAddress })

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
