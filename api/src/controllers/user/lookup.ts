// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { UserLookupResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '@/schemas/user'
import logger from '@/utils/logger'
import { getChatToken } from '@/utils/tracker'

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
    featureFlags: 1,
    platformRole: 1
  })

  const userInfo: UserLookupResponse = {
    apiKeys: info.apiKeys,
    email: user.email,
    feature_flags: info.featureFlags,
    fullname: user.fullname,
    platformRole: info.platformRole,
    user_hash: await getChatToken(user),
    user_id: user._id.toHexString(),
    username: user.username
  }

  return res.status(200).json(userInfo)
}
