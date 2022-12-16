// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { diskSpace } from '@sindresorhus/df'
import type {
  EPlatformRole,
  ETeamRole,
  PlatformStatsResponse
} from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import {
  BatchModel,
  ComparisonModel,
  ElementModel,
  MessageModel,
  UserModel
} from '../../schemas/index.js'
import { config, logger, redisClient } from '../../utils/index.js'

export async function platformStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cacheKey = 'platform-stats'
  logger.debug('received health check request')

  // check if we recently obtained platform health information
  if (await redisClient.isCached(cacheKey)) {
    logger.debug('returning statistics from cache')
    const cachedResponseStr = await redisClient.getCached<string>(cacheKey)
    const cachedResponse = JSON.parse(cachedResponseStr)
    return res.status(200).json(cachedResponse)
  }

  const space = (await diskSpace())
    .filter(
      (v) =>
        v.mountpoint === '/' ||
        (v.mountpoint === '' && v.filesystem === 'overlay')
    )
    .map((v) => ({
      spaceFree: Math.floor((v.available / 1024 / 1024 / 1024) * 100) / 100,
      spaceSize: Math.floor((v.size / 1024 / 1024 / 1024) * 100) / 100,
      spaceUsed: Math.floor((1 - v.available / v.size) * 100) / 100
    }))
    .shift()

  const platformRoleSuper: EPlatformRole = 'super'
  const users = await UserModel.find(
    {
      platformRole: { $not: { $eq: platformRoleSuper } }
    },
    {
      _id: 0,
      activationKey: 1,
      createdAt: 1,
      email: 1,
      fullname: 1,
      lockedAt: 1,
      resetKey: 1,
      resetKeyExpiresAt: 1,
      platformRole: 1,
      suspended: 1,
      username: 1
    }
  )

  const find = {
    resetKeyCreatedAt: (expiresAt: Date) => {
      if (!expiresAt) {
        return undefined
      }
      const value = new Date(expiresAt)
      value.setMinutes(value.getMinutes() - 30)
      return value
    },
    activationLink: (key: string) => {
      if (key) {
        return `${config.webapp.root}/account/activate?key=${key}`
      }
    },
    resetKeyLink: (key: string) => {
      if (key) {
        return `${config.webapp.root}/account/reset?key=${key}`
      }
    }
  }

  const response: PlatformStatsResponse = {
    countBatches: await BatchModel.countDocuments(),
    countComparisons: await ComparisonModel.countDocuments(),
    countElements: await ElementModel.countDocuments(),
    countMessages: await MessageModel.countDocuments(),
    ...space,
    users: users.map((v) => ({
      activationLink: find.activationLink(v.activationKey),
      createdAt: v.createdAt as unknown as string,
      email: v.email,
      fullname: v.fullname,
      lockedAt: v.lockedAt as unknown as string,
      resetKeyLink: find.resetKeyLink(v.resetKey),
      resetKeyCreatedAt: find.resetKeyCreatedAt(
        v.resetKeyExpiresAt
      ) as unknown as string,
      resetKeyExpiresAt: v.resetKeyExpiresAt as unknown as string,
      role: v.platformRole as unknown as ETeamRole,
      suspended: v.suspended || undefined,
      username: v.username
    }))
  }

  // cache platform statistics information in redis database
  logger.debug('caching statistics')
  redisClient.cache(
    cacheKey,
    JSON.stringify(response),
    config.redis.durationLong
  )

  return res.status(200).json(response)
}
