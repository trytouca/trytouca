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
  const askedEmail = (req.body.email as string).toLowerCase()
  logger.debug('received request to resend welcome email')

  // check if email is associated with any account

  const user = await UserModel.findOne(
    { email: askedEmail },
    { _id: 1, activationKey: 1, email: 1, fullname: 1, username: 1 }
  )

  // abort if account associated with given email is not found

  if (!user) {
    logger.warn('%s: account not found', askedEmail)
    return next({
      errors: ['account not found'],
      status: 404
    })
  }

  logger.info('%s: resending verification email', user.username)

  const link = `${config.webapp.root}/account/activate?key=${user.activationKey}`
  mailer.mailUser(user, 'Welcome to Weasel', 'auth-signup-user', {
    verificationLink: link
  })

  return res.status(204).send()
}
