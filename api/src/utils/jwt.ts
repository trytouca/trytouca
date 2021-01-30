/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import jws from 'jws'

import { ISessionDocument } from '../schemas/session'
import { config } from '../utils/config'
import logger from '../utils/logger'

type TokenPayload = {
  exp: number
  sub: string
}

type TokenInput = {
  expiresAt: Date
  _id: string
}

/**
 * Generates a JSON Web Token (JWT) for a given user session.
 *
 * Note that for extra security, the payload does not include any
 * information other than the session id which should be adequate
 * to identify the user.
 */
export function issue(session: TokenInput): string {
  return jws.sign({
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      exp: Math.floor(session.expiresAt.getTime() / 1000),
      sub: session._id
    },
    secret: config.auth.jwtSecret
  })
}

/**
 *
 */
export function extractPayload(token: string): TokenPayload {
  if (!token) {
    logger.silly('authentication cookie missing')
    return
  }

  // token should include a valid JWT token

  if (!jws.verify(token, 'HS256', config.auth.jwtSecret)) {
    logger.silly('token corrupt')
    return
  }

  // token payload should have `sub` and `exp` fields

  const payload = jws.decode(token).payload
  if (!payload.exp || !payload.sub) {
    logger.silly('token payload invalid')
    return
  }

  return payload
}
