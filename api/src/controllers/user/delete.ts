// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { userDelete } from '../../models/index.js'
import { IUser, TeamModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function ctrlUserDelete(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.user as IUser
  logger.info('%s: attempting to delete account', account.username)

  // reject request if account is owner of the platform
  if (account.platformRole === 'owner') {
    return next({
      status: 403,
      errors: ['refusing to delete account: server owner']
    })
  }

  // reject request if account is the owner of a team
  if ((await TeamModel.countDocuments({ owner: account._id })) !== 0) {
    return next({
      status: 403,
      errors: ['refusing to delete account: owns team']
    })
  }

  res.status(202).send()
  userDelete(account)
}
