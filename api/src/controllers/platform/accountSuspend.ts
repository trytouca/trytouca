// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { SessionModel } from '@/schemas/session'
import { IUser, UserModel } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import logger from '@/utils/logger'

/**
 *
 */
export async function platformAccountSuspend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  const user = res.locals.user as IUser
  logger.debug('%s: suspending account %s', user.username, account.username)

  if (account.platformRole !== EPlatformRole.User) {
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
  return res.status(204).send()
}
