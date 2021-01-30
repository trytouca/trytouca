/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'
import * as mailer from '../../utils/mailer'

/**
 *
 */
export async function authVerifyResend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.info('%s: resending verification email', user.username)

  const doc = await UserModel.findById(user._id, { activationKey: 1 })
  const verificationLink = `${config.webapp.root}/activate?key=${doc.activationKey}`

  mailer.mailUser(user, 'Verify Email Address', 'auth-signup-user', {
    username: user.username,
    verificationLink
  })

  return res.status(204).send()
}
