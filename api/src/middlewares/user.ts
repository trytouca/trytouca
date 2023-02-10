// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { wslFindByUname } from '../models/index.js'
import { IUser, SessionModel, UserModel } from '../schemas/index.js'
import { jwtExtract, logger, redisClient } from '../utils/index.js'

type AuthInput = {
  agent: string
  ipAddr: string
  token: string
}

async function isAuthenticatedImpl(input: AuthInput): Promise<IUser> {
  // request should have an http-only cookie with a signed JWT bearer token
  // and a payload format according to our expectations.

  const payload = jwtExtract(input.token)
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

  const sessionId = new mongoose.Types.ObjectId(payload.sub)

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

async function isClientOrUserAuthenticatedImpl(
  req: Request,
  res: Response,
  next: NextFunction,
  inputs: Partial<Record<'clientKey' | 'clientToken' | 'cookie', string>>
) {
  const user = inputs.clientKey
    ? await UserModel.findOne({
        apiKeys: inputs.clientKey,
        lockedAt: { $exists: false },
        suspended: false
      })
    : await isAuthenticatedImpl({
        agent: req.header('user-agent'),
        ipAddr: req.ip,
        token: inputs.cookie ?? inputs.clientToken
      })

  if (!user) {
    if (inputs.cookie) {
      res.clearCookie('authToken', {
        httpOnly: true,
        path: '/',
        secure: false,
        signed: true
      })
    }
    return next({ errors: ['auth failed'], status: 401 })
  }

  // handles cli login flow
  {
    const token = req.cookies['clientAuthToken']
    if (token) {
      logger.debug('%s: client auth token cookie received', user.username)
      const key = `client_auth_token:${token}`
      const value = await redisClient.get(key)
      if (value == null) {
        logger.debug('%s: client auth token cookie invalid', user.username)
      } else if (value == '') {
        const { apiKeys } = await UserModel.findById(user._id).select({
          apiKeys: 1
        })
        await redisClient.set(key, apiKeys[0])
        res.clearCookie('clientAuthToken')
        logger.debug('%s: client auth token cookie verified', user.username)
      }
    }
  }

  logger.silly(
    '%s:%s is authenticated',
    user.username,
    inputs.cookie ? '' : ' client'
  )
  res.locals.user = user
  return next()
}

/**
 * Checks if user initiating the request is authenticated.
 *
 * Populates local response variables: `user`.
 *
 * @returns
 * - Error 401 if user initiating the request is not authenticated.
 */
export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return isClientOrUserAuthenticatedImpl(req, res, next, {
    cookie: req.signedCookies.authToken
  })
}

export async function isClientAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return isClientOrUserAuthenticatedImpl(req, res, next, {
    clientKey: req.header('x-touca-api-key'),
    clientToken: req.header('authorization')?.split(' ')[1]
  })
}

export async function isClientOrUserAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return isClientOrUserAuthenticatedImpl(req, res, next, {
    clientKey: req.header('x-touca-api-key'),
    clientToken: req.header('authorization')?.split(' ')[1],
    cookie: req.signedCookies.authToken
  })
}

export async function isPlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser

  // return 403 if user does not have admin role

  if (user.platformRole !== 'owner' && user.platformRole !== 'admin') {
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
  if (!account) {
    return next({ errors: ['user not found'], status: 404 })
  }
  logger.silly('%s: account exists', username)
  res.locals.account = account
  return next()
}

export async function hasSuspendedAccount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const username = req.params.account
  const account = await UserModel.findOne(
    { username: username, suspended: true },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
  )
  if (!account) {
    return next({ errors: ['suspended account not found'], status: 404 })
  }
  logger.silly('%s: suspended account exists', username)
  res.locals.account = account
  return next()
}

export async function findPlatformRole(req: Request): Promise<EPlatformRole> {
  const user = await isAuthenticatedImpl({
    agent: req.header('user-agent'),
    ipAddr: req.ip,
    token: req.signedCookies.authToken
  })
  return user?.platformRole ?? 'guest'
}
