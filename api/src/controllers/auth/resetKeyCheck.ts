// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { UserModel } from '../../schemas/user.js'
import logger from '../../utils/logger.js'

export async function authResetKeyCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const resetKey = req.params.key
  logger.debug('received request to evaluate reset key')

  // return 400 if reset key is invalid

  const user = await UserModel.findOne({ resetKey })
  if (!user) {
    return next({
      errors: ['reset key invalid'],
      status: 400
    })
  }

  // return 400 if reset key is expired

  if (user.resetKeyExpiresAt < new Date()) {
    return next({
      errors: ['reset key expired'],
      status: 400
    })
  }

  // return basic user information

  logger.info('%s: provided account information for reset key', user.username)

  return res.status(200).json({
    email: user.email,
    username: user.username,
    fullname: user.fullname
  })
}
