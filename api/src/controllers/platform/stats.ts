// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import df from '@sindresorhus/df'
import type { EPlatformRole, PlatformStatsResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { BatchModel } from '@/schemas/batch'
import { ComparisonModel } from '@/schemas/comparison'
import { ElementModel } from '@/schemas/element'
import { MessageModel } from '@/schemas/message'
import { MetaModel } from '@/schemas/meta'
import { UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

export async function platformStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cacheKey = 'platform-stats'
  logger.debug('received health check request')

  // check if we recently obtained platform health information
  if (await rclient.isCached(cacheKey)) {
    logger.debug('returning statistics from cache')
    const cachedResponseStr = await rclient.getCached<string>(cacheKey)
    const cachedResponse = JSON.parse(cachedResponseStr)
    return res.status(200).json(cachedResponse)
  }

  const space = (await df())
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

  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
  }

  const meta = await MetaModel.findOne({}, { _id: 0 })

  const response: PlatformStatsResponse = {
    cmpAvgCollectionTime: meta.cmpAvgCollectionTime,
    cmpAvgProcessingTime: meta.cmpAvgProcessingTime,
    countBatches: await BatchModel.countDocuments(),
    countComparisons: await ComparisonModel.countDocuments(),
    countElements: await ElementModel.countDocuments(),
    countMessages: await MessageModel.countDocuments(),
    ...space,
    // @ts-ignore
    users: users.map((v) => ({
      activationLink: find.activationLink(v.activationKey),
      createdAt: v.createdAt,
      email: v.email,
      fullname: v.fullname,
      lockedAt: v.lockedAt,
      resetKeyLink: find.resetKeyLink(v.resetKey),
      resetKeyCreatedAt: find.resetKeyCreatedAt(v.resetKeyExpiresAt),
      resetKeyExpiresAt: v.resetKeyExpiresAt,
      role: v.platformRole,
      suspended: v.suspended || undefined,
      username: v.username
    }))
  }

  // cache platform statistics information in redis database
  logger.debug('caching statistics')
  rclient.cache(cacheKey, JSON.stringify(response), config.redis.durationLong)

  return res.status(200).json(response)
}
