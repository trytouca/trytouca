/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NotificationModel } from '@weasel/schemas/notification'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { NextFunction, Request, Response } from 'express'

/**
 *
 */
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
