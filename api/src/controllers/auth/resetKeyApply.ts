// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'

import { UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import { notifyPlatformAdmins } from '@/utils/inbox'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { analytics, EActivity } from '@/utils/tracker'

export async function authResetKeyApply(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const resetKey = req.params.key
  const askedUsername = (req.body.username as string).toLowerCase()
  logger.debug('%s: resetting account password', askedUsername)
  const hash = await bcrypt.hash(req.body.password, config.auth.bcryptSaltRound)

  // if username and resetKey match an account that is not suspended,
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
      username: askedUsername
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

  mailer.mailUser(
    user,
    'Password Reset Confirmation',
    'auth-password-confirm',
    {
      greetings: user.fullname ? `Hi ${user.fullname}` : `Hi there`,
      loginLink: `${config.webapp.root}/account/signin`
    }
  )

  notifyPlatformAdmins('%s reset their password.', user.username)
  analytics.add_activity(EActivity.AccountPasswordReset, user)

  return res.status(204).send()
}
