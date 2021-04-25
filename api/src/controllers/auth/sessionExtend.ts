/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { SessionModel } from '@weasel/schemas/session'
import { config } from '@weasel/utils/config'
import * as jwt from '@weasel/utils/jwt'
import logger from '@weasel/utils/logger'

/**
 *
 */
export async function authSessionExtend(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // the easiest way to get session id is from JSON Web Token which
  // is, at this point, validated by previous middleware.
  // find session id from signed http-only cookie named authToken

  const sessionId = jwt.extractPayload(req.signedCookies.authToken).sub

  // find new expiration date

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.auth.jwtLifetime)

  // refresh expiration date of the session

  const session = await SessionModel.findByIdAndUpdate(
    sessionId,
    { $set: { expiresAt } },
    { new: true }
  )

  // issue a new token for the same session but with new expiration date

  logger.info('%s: refreshed user token', sessionId)
  res.cookie('authToken', jwt.issue(session), {
    expires: session.expiresAt,
    httpOnly: true,
    path: '/',
    secure: false,
    signed: true
  })

  return res.status(200).json({ expiresAt: session.expiresAt })
}
