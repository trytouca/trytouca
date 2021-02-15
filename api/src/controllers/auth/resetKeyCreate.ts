/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { UserModel } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'
import * as mailer from '../../utils/mailer'

/**
 *
 */
export async function authResetKeyCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedEmail = req.body.email
  logger.debug('received request to create password reset key')

  // check if email is associated with any account

  const user = await UserModel.findOne({ email: askedEmail })

  // abort if account associated with given email is not found

  if (!user) {
    logger.warn('%s: account not found', askedEmail)
    return next({
      errors: ['account not found'],
      status: 404
    })
  }

  // abort if user is indefinitely suspended

  if (user.suspended) {
    logger.warn('%s: rejecting reset request of suspended user', user.username)
    return next({
      errors: ['account suspended'],
      status: 423
    })
  }

  // abort if user is temporarily locked

  if (user.lockedAt) {
    const lockedUntil = user.lockedAt
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
    if (new Date() < lockedUntil) {
      logger.warn('%s: rejecting reset request of locked user', user.username)
      return next({
        errors: ['account locked'],
        status: 423
      })
    }
  }

  // generate reset key in RFC4122 uuid format

  const resetKey = uuidv4()

  // find maximum lifetime of reset key

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + config.auth.maxResetKeyLifetime)

  // apply reset key to user account

  logger.silly('%s: applying reset key to user account', user.username)
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { resetKey, resetKeyExpiresAt: expiresAt }
  })
  logger.info('%s: applied reset key to user account', user.username)

  // send email to user with their reset key

  const resetLink = `${config.webapp.root}/reset?key=${resetKey}`

  mailer.mailUser(user, 'Password Reset', 'auth-password-start', {
    username: user.username,
    expiresIn: config.auth.maxResetKeyLifetime.toString(),
    resetLink
  })

  return res.status(204).send()
}
