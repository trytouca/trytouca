/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'

/**
 *
 */
export async function authVerifyActivate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const activationKey = req.params.key
  logger.debug('received request to activate user')

  // return 400 if activation key is invalid

  if (activationKey.length !== config.auth.activationKeyLength) {
    return next({
      errors: ['invalid activation key'],
      status: 400
    })
  }

  // check if activation key is associated with any inactive user

  const user = (await UserModel.findOneAndUpdate(
    { activationKey },
    {
      $set: { activatedAt: new Date() },
      $unset: { activationKey: true }
    }
  )) as IUser

  // return 404 if activation key is not found

  if (!user) {
    return next({
      errors: ['activation key not found'],
      status: 404
    })
  }
  logger.info('%s: verified account', user.username)

  return res.status(204).send()
}
