/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { SessionModel } from '../../schemas/session'
import { EPlatformRole } from '../../commontypes'
import { IUser, UserModel } from '../../schemas/user'
import logger from '../../utils/logger'

export async function accountDeleteOther(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return res.status(204).send()
}

export async function accountDeleteOwn(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const doc = await UserModel.findById(user._id)
  logger.info('%s: attempting to delete account', user.username)

  // reject request if user is owner of the platform

  if (user.platformRole === EPlatformRole.Owner) {
    return next({
      status: 403,
      errors: ['refusing to delete account of platform owner']
    })
  }

  // reject request if user is a member of a team

  if (doc.teams.length !== 0) {
    return next({
      status: 403,
      errors: ['refusing to delete account with active team membership']
    })
  }

  // reject request if user has a pending invitation

  if (doc.prospectiveTeams.length !== 0) {
    return next({
      status: 403,
      errors: ['refusing to delete account with pending invitation']
    })
  }

  logger.info('%s: deleting account', user.username)

  await SessionModel.deleteMany({ userId: user._id })
  await UserModel.deleteMany({ _id: user._id })

  return res.status(204).send()
}
