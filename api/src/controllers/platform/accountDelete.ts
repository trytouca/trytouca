// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { userDelete } from '@/models/user'
import { TeamModel } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { EPlatformRole } from '@touca/api-schema'
import logger from '@/utils/logger'

export async function platformAccountDelete(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  logger.info('%s: attempting to delete account', account.username)

  // reject request if account is owner of the platform
  if (account.platformRole === EPlatformRole.Owner) {
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

  await userDelete(account)
  return res.status(204).send()
}
