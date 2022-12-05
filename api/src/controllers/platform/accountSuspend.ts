// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { SessionModel } from '../../schemas/session.js'
import { IUser, UserModel } from '../../schemas/user.js'
import logger from '../../utils/logger.js'
import { redisClient } from '../../utils/redis.js'

export async function platformAccountSuspend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  const user = res.locals.user as IUser
  logger.debug('%s: suspending account %s', user.username, account.username)

  if (account.platformRole !== 'user') {
    return next({
      errors: ['cannot suspend admin accounts'],
      status: 409
    })
  }

  await UserModel.findByIdAndUpdate(account._id, { $set: { suspended: true } })

  await SessionModel.updateMany(
    { _id: account._id },
    { $set: { expiresAt: new Date() } }
  )

  logger.info('%s: suspended account %s', user.username, account.username)
  redisClient.removeCached('platform-stats')
  return res.status(204).send()
}
