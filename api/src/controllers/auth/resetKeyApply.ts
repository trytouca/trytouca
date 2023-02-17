// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'

import { UserModel } from '../../schemas/index.js'
import {
  analytics,
  config,
  logger,
  mailUser,
  notifyPlatformAdmins
} from '../../utils/index.js'

export async function authResetKeyApply(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const resetKey = req.params.key
  const askedEmail = req.body.email
  logger.debug('received request to reset account password')
  const hash = await bcrypt.hash(req.body.password, config.auth.bcryptSaltRound)

  // if email and resetKey match an account that is not suspended,
  // reset the password and invalidate resetKey
  //
  // this one-time find and update implementation allows users to reset
  // their password to the one already on file. that is okay: they may
  // not remember what their current password is.

  const user = await UserModel.findOneAndUpdate(
    {
      resetKey,
      resetKeyExpiresAt: { $gt: new Date() },
      suspended: false,
      email: askedEmail
    },
    {
      $set: { password: hash, resetAt: new Date() },
      $unset: { resetKey: true, resetKeyExpiresAt: true }
    }
  )

  // if above query does not return a user, it indicates that the
  // request was not valid.

  if (!user) {
    return next({
      errors: ['reset key invalid'],
      status: 404
    })
  }
  logger.info('%s: reset their password', user.username)

  // notify user that their account password was reset

  mailUser(user, 'Password Reset Confirmation', 'auth-password-confirm', {
    greetings: user.fullname ? `Hi ${user.fullname}` : `Hi there`,
    loginLink: `${config.webapp.root}/account/signin`
  })

  notifyPlatformAdmins('%s reset their password.', user.username)
  analytics.add_activity('account:password_reset', user)

  return res.status(204).send()
}
