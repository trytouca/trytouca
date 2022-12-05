// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { IUser, NotificationModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function inboxList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.silly('%s: listing notifications', user.username)

  const notifs = await NotificationModel.find(
    { userId: user._id },
    { _id: 0, createdAt: 1, seenAt: 1, text: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(20)

  return res.status(200).json(notifs)
}
