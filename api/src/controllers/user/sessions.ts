// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { IUser, SessionModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function userSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.debug('%s: list active user sessions', user.username)

  const sessions = await SessionModel.find(
    {
      userId: user._id,
      expiresAt: { $gte: new Date() }
    },
    {
      agent: 1,
      expiresAt: 1,
      ipAddr: 1
    }
  )

  return res.status(200).json(sessions)
}
