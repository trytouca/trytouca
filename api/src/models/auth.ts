/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { SessionModel } from '@/schemas/session'
import { IUserDocument, UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import * as jwt from '@/utils/jwt'
import logger from '@/utils/logger'

/**
 * Create a new user session or re-uses an existing one.
 */
export async function createUserSession(
  user: IUserDocument,
  options: { askedAgent: string; askedIpAddress: string }
): Promise<{ token: string; expiresAt: Date }> {
  // edge case:
  // if user has an active unexpired session with matching metadata
  // provide the same token that we had provided before.

  const prevSession = await SessionModel.findOne({
    agent: options.askedAgent,
    expiresAt: { $gt: new Date() },
    ipAddr: options.askedIpAddress,
    userId: user._id
  })

  if (prevSession) {
    logger.debug('%s: reusing previously issued token', user.username)
    return { token: jwt.issue(prevSession), expiresAt: prevSession.expiresAt }
  }

  // in the more likely case, when the user had no prior active session
  // with matching metadata, issue a new auth token.

  logger.debug('%s: issuing auth token for user', user.username)

  await UserModel.findByIdAndUpdate(user._id, {
    $unset: { lockedAt: true, loginAttempts: true }
  })

  // set expiration date of the token

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.auth.jwtLifetime)

  // add user session to database.

  const session = await SessionModel.create({
    agent: options.askedAgent,
    expiresAt,
    ipAddr: options.askedIpAddress,
    userId: user._id
  })

  // generate a JSON web token

  const token = jwt.issue(session)
  logger.info('%s: issued auth token', user.username)

  return { token, expiresAt }
}
