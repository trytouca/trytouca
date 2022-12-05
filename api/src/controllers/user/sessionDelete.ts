// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { IUser, SessionModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function userSessionDelete(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const sessionId = req.params.id

  logger.debug('%s: expire active user session', user.username)

  await SessionModel.updateOne(
    {
      _id: sessionId,
      userId: user._id,
      expiresAt: { $gte: new Date() }
    },
    {
      $set: {
        expiresAt: new Date()
      }
    }
  )

  return res.status(204).send()
}
