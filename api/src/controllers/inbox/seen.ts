/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { NotificationModel } from '@weasel/schemas/notification'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'

/**
 *
 */
export async function inboxSeen(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser

  await NotificationModel.updateMany(
    { userId: user._id, seenAt: { $exists: false } },
    { $set: { seenAt: new Date() } }
  )

  logger.info('%s: marked notifications as seen', user.username)
  return res.status(204).send()
}
