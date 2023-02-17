// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'

import { createUserSession } from '../../models/index.js'
import { UserModel } from '../../schemas/index.js'
import { analytics, config, logger, mailUser } from '../../utils/index.js'

export async function authSessionCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const asked = {
    agent: req.header('user-agent'),
    ipAddress: req.ip,
    email: req.body.email,
    password: req.body.password
  }
  logger.debug('received request to login user')

  // Bail if email does not match an account.
  // We return 401 instead of 404 for extra security
  const user = await UserModel.findOne({ email: asked.email })
  if (!user) {
    logger.debug('%s: rejecting login due to invalid email', asked.email)
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

  const isPasswordValid = await bcrypt.compare(asked.password, user.password)
  if (!isPasswordValid) {
    logger.debug('%s: failed login attempt for user account', user.username)

    // lock account if user exceeded maximum number of failed login attempts.
    if (config.auth.maxLoginAttempts <= user.loginAttempts) {
      logger.info('%s: temporarily locking user account', user.username)
      await UserModel.findByIdAndUpdate(user._id, {
        $set: {
          lockedAt: new Date(),
          loginAttempts: 0
        }
      })

      // notify user that their account was temporarily locked
      mailUser(user, 'Account Temporarily Locked', 'auth-signin-user-locked', {
        greetings: user.fullname ? `Hi ${user.fullname}` : `Hello`
      })
    }

    // otherwise increment number of failed login attempts
    else {
      await UserModel.findByIdAndUpdate(user._id, {
        $inc: { loginAttempts: 1 }
      })
    }

    return next({
      errors: ['invalid login credentials'],
      status: 401
    })
  }

  // now we recognize user attempt as legitimate.
  logger.debug('%s: signin request validated', user.username)
  const session = await createUserSession(user, {
    askedAgent: asked.agent,
    askedIpAddress: asked.ipAddress
  })

  analytics.add_member(user, { ip_address: asked.ipAddress }).then(() => {
    analytics.add_activity('account:logged_in', user)
  })

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
