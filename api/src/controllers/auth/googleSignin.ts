// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'

import { createUserAccount, createUserSession } from '../../models/index.js'
import { IUserDocument, UserModel } from '../../schemas/index.js'
import { analytics, config, EActivity, logger } from '../../utils/index.js'

export async function authGoogleSignin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const google_token = req.body.google_token
  const askedAgent = req.headers['user-agent']
  const askedIpAddress = req.ip
  logger.debug('received google token')

  // check that client id is set

  if (!config.auth.googleClientId) {
    return next({
      errors: ['feature not available'],
      status: 403
    })
  }

  const client = new OAuth2Client(config.auth.googleClientId)
  const ticket = await client.verifyIdToken({
    idToken: google_token,
    audience: config.auth.googleClientId
  })
  const payload = ticket.getPayload()

  // check that google account is verified

  if (!payload.email || !payload.email_verified) {
    logger.debug('rejecting login: email account not verified')
    return next({
      errors: ['account not verified'],
      status: 401
    })
  }

  // create account if google account is not recognized

  let user: IUserDocument = await UserModel.findOne({ email: payload.email })
  if (user) {
    await UserModel.findByIdAndUpdate(user._id, {
      $set: { activatedAt: new Date(), fullname: payload.name }
    })
  } else {
    user = await createUserAccount({
      email: payload.email,
      avatar: payload.picture,
      ip_address: askedIpAddress,
      name: payload.name,
      first_name: payload.given_name,
      last_name: payload.family_name
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

  logger.debug('%s: signin request validated', user.username)

  const session = await createUserSession(user, {
    askedAgent,
    askedIpAddress
  })

  // add event to tracking system

  analytics
    .add_member(user, {
      avatar: payload.picture,
      name: user.fullname ?? payload.name,
      first_name: payload.given_name,
      last_name: payload.family_name,
      ip_address: askedIpAddress
    })
    .then(() => analytics.add_activity(EActivity.AccountLoggedIn, user))

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
