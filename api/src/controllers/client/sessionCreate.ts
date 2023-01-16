// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { SessionModel, UserModel } from '../../schemas/index.js'
import { config, jwtIssue, logger } from '../../utils/index.js'

export async function clientSessionCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.body.key as string
  const askedAgent = req.header('user-agent')
  const askedIpAddress = req.ip
  logger.silly('%s: received request to authenticate client', apiKey)

  // check if apiKey is associated with any user account

  const user = await UserModel.findOne({ apiKeys: apiKey })
  if (!user) {
    logger.debug('%s: api key invalid', apiKey)
    return next({
      errors: ['invalid api key'],
      status: 401
    })
  }

  // return 423 if user is indefinitely suspended

  if (user.suspended) {
    logger.debug('%s: rejecting login of suspended user', user.username)
    return next({
      errors: ['account suspended'],
      status: 423
    })
  }

  // return 423 if user is temporarily locked

  if (user.lockedAt) {
    const lockedUntil = user.lockedAt
    lockedUntil.setMinutes(lockedUntil.getMinutes() + 30)
    if (new Date() < lockedUntil) {
      logger.debug('%s: rejecting login of locked user', user.username)
      return next({
        errors: ['account locked'],
        status: 423
      })
    }
  }

  // edge case:
  // if user has an active unexpired session with matching metadata
  // provide the same token that we had provided before. We use a buffer
  // here to ensure that the time remaining for the token to be expired is long enough
  // for the test to finish.

  const buffer = new Date()
  buffer.setHours(buffer.getHours() + (config.auth.jwtLifetimeClient * 24) / 4)

  const prevSession = await SessionModel.findOne({
    agent: askedAgent,
    expiresAt: { $gt: buffer },
    ipAddr: askedIpAddress,
    userId: user._id
  })
  if (prevSession) {
    logger.debug('%s: reusing previously issued token', user.username)
    return res.status(200).json({ token: jwtIssue(prevSession) })
  }

  // in the more likely case, when the user had no prior active session
  // with matching metadata, issue a new auth token.

  logger.debug('%s: issuing auth token for client', user.username)

  // set expiration date of the token

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.auth.jwtLifetimeClient)

  // add user session to database.

  const session = await SessionModel.create({
    agent: askedAgent,
    expiresAt,
    ipAddr: askedIpAddress,
    userId: user._id
  })

  // generate a JSON web token

  const token = jwtIssue(session)
  logger.info('%s: issued auth token', user.username)

  // return session token to the user

  return res.status(200).json({ token, expiresAt })
}
