/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { EPlatformRole } from '../commontypes'
import { wslFindByUname } from '@weasel/models/user'
import { SessionModel } from '@weasel/schemas/session'
import { IUser } from '@weasel/schemas/user'
import * as jwt from '@weasel/utils/jwt'
import logger from '@weasel/utils/logger'

type AuthInput = {
  agent: string
  ipAddr: string
  token: string
}

/**
 *
 */
async function isAuthenticatedImpl(input: AuthInput): Promise<IUser> {
  // request should have an http-only cookie with a signed JWT bearer token
  // and a payload format according to our expectations.

  const payload = jwt.extractPayload(input.token)
  if (!payload) {
    return
  }

  // token should have an expiration date in the future

  if (payload.exp <= Math.floor(new Date().getTime() / 1000)) {
    logger.warn('token expired')
    return
  }

  // find if the token corresponds to a valid unexpired session for an
  // account that is neither locked nor suspended

  const sessionId = mongoose.Types.ObjectId(payload.sub)

  const sessions = await SessionModel.aggregate([
    { $match: { _id: sessionId } },
    {
      $match: {
        agent: input.agent,
        expiresAt: { $gt: new Date() },
        ipAddr: input.ipAddr
      }
    },
    {
      $lookup: {
        as: 'userDoc',
        foreignField: '_id',
        from: 'users',
        localField: 'userId'
      }
    },
    { $unwind: '$userDoc' },
    {
      $match: {
        'userDoc.lockedAt': { $exists: false },
        'userDoc.suspended': false
      }
    },
    {
      $project: {
        _id: 0,
        'userDoc._id': 1,
        'userDoc.email': 1,
        'userDoc.fullname': 1,
        'userDoc.platformRole': 1,
        'userDoc.username': 1
      }
    }
  ])

  // we expect that there is one and only one active session found
  // for an auth token to be valid

  if (sessions.length !== 1) {
    logger.warn('%s: no active session for auth token', sessionId)
    return
  }

  return sessions[0].userDoc
}

/**
 * @summary
 * Checks if user initiating the request is authenticated.
 *
 * @description
 *
 * - Populates local response variables: `user`.
 * - Expects request parameters: N/A
 * - Expects local response variables: N/A
 * - Database Queries: 1
 *
 * @returns
 * - Error 401 if user initiating the request is not authenticated.
 */
export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = await isAuthenticatedImpl({
    agent: req.headers['user-agent'],
    ipAddr: req.ip,
    token: req.signedCookies.authToken
  })
  if (!user) {
    res.clearCookie('authToken', {
      httpOnly: true,
      path: '/',
      secure: false,
      signed: true
    })
    return res.status(401).json({
      errors: ['auth failed']
    })
  }

  logger.silly('%s: is authenticated', user.username)
  res.locals.user = user
  return next()
}

/**
 *
 */
export async function isClientAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = await isAuthenticatedImpl({
    agent: req.headers['user-agent'],
    ipAddr: req.ip,
    token: req.headers['authorization'].split(' ')[1]
  })
  if (!user) {
    return next({
      errors: ['auth failed'],
      status: 401
    })
  }

  logger.silly('%s: client is authenticated', user.username)
  res.locals.user = user
  return next()
}

/**
 *
 */
export async function isPlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser

  // return 403 if user does not have admin role

  if (![EPlatformRole.Owner, EPlatformRole.Admin].includes(user.platformRole)) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  logger.silly('%s: is platform admin', user.username)
  return next()
}

/**
 * @summary
 * Checks if an account exists.
 *
 * @description
 * Checks if an account whose username is specified in request parameter
 * as `account` exists.
 *
 * - Populates local response variables: `account`.
 * - Expects request parameters: `account`
 * - Expects local response variables: N/A
 * - Database Queries: 1
 *
 * @returns
 * - Error 404 if account (`account`) is not registered or is suspended.
 */
export async function hasAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const username = req.params.account
  const account = await wslFindByUname(username)

  // return 404 if account with specified username does not exist

  if (!account) {
    return next({
      errors: ['user not found'],
      status: 404
    })
  }

  logger.silly('%s: account exists', username)
  res.locals.account = account
  return next()
}
