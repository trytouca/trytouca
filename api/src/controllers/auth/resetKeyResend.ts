// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { analytics, EActivity } from '@/utils/tracker'

export async function authResetKeyResend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedEmail = (req.body.email as string).toLowerCase()
  logger.debug('received request to resend password reset email')

  // check if email is associated with any account

  const user = await UserModel.findOne(
    {
      email: askedEmail,
      resetKey: { $exists: true },
      resetKeyExpiresAt: { $gt: new Date() },
      suspended: false
    },
    {
      _id: 1,
      email: 1,
      fullname: 1,
      resetKey: 1,
      username: 1
    }
  )

  // abort if account associated with given email is not found

  if (!user) {
    return next({
      errors: ['password not reset'],
      status: 404
    })
  }

  // extend reset key expiration date

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + config.auth.maxResetKeyLifetime)
  await UserModel.findByIdAndUpdate(user._id, {
    $set: { resetKeyExpiresAt: expiresAt }
  })

  // send email to user with their reset key

  mailer.mailUser(user, 'Password Reset', 'auth-password-start', {
    greetings: user.fullname ? `Hi ${user.fullname}` : `Hello`,
    expiresIn: config.auth.maxResetKeyLifetime.toString(),
    resetLink: `${config.webapp.root}/account/reset?key=${user.resetKey}`
  })

  analytics.add_activity(EActivity.AccountPasswordResent, user)

  return res.status(204).send()
}
