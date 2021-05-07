/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { SessionModel } from '@weasel/schemas/session'
import { IUser, UserModel } from '@weasel/schemas/user'
import { EPlatformRole } from '@weasel/types/commontypes'
import logger from '@weasel/utils/logger'
import { NextFunction, Request, Response } from 'express'

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
