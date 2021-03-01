/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import type { UserLookupResponse } from '../../commontypes'
import { IUser, UserModel } from '../../schemas/user'
import logger from '../../utils/logger'

/**
 *
 */
export async function userLookup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.debug('%s: looking up user info', user.username)

  // Authentication middleware provides general information about this
  // user. That information is designed to be minimal since it is provided
  // to all the routes. Since that information is not sufficient for us,
  // we choose to pay the cost of another database query to obtain more
  // information.

  const info = await UserModel.findById(user._id, {
    activatedAt: 1,
    apiKeys: 1,
    createdAt: 1,
    platformRole: 1
  })

  const userInfo: UserLookupResponse = {
    apiKeys: info.apiKeys,
    email: user.email,
    fullname: user.fullname,
    platformRole: info.platformRole,
    username: user.username
  }

  return res.status(200).json(userInfo)
}
