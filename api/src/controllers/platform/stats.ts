/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import df from '@sindresorhus/df'
import { BatchModel } from '@weasel/schemas/batch'
import { ComparisonModel } from '@weasel/schemas/comparison'
import { ElementModel } from '@weasel/schemas/element'
import { MessageModel } from '@weasel/schemas/message'
import { MetaModel } from '@weasel/schemas/meta'
import { UserModel } from '@weasel/schemas/user'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'
import { EPlatformRole, PlatformStatsResponse } from '../../commontypes'

/**
 *
 */
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
    .filter((v) => v.mountpoint === '/')
    .map((v) => ({
      spaceFree: Math.floor((v.available / 1024 / 1024 / 1024) * 100) / 100,
      spaceSize: Math.floor((v.size / 1024 / 1024 / 1024) * 100) / 100,
      spaceUsed: Math.floor((1 - v.available / v.size) * 100) / 100
    }))
    .shift()

  const users = await UserModel.find(
    { platformRole: { $not: { $eq: EPlatformRole.Super } } },
    {
      _id: 0,
      activationKey: 1,
      createdAt: 1,
      email: 1,
      fullname: 1,
      resetKey: 1,
      resetKeyExpiresAt: 1,
      platformRole: 1,
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

  const meta = await MetaModel.findOne({}, { _id: 0 })

  const response: PlatformStatsResponse = {
    cmpAvgCollectionTime: meta.cmpAvgCollectionTime,
    cmpAvgProcessingTime: meta.cmpAvgProcessingTime,
    countBatches: await BatchModel.countDocuments(),
    countComparisons: await ComparisonModel.countDocuments(),
    countElements: await ElementModel.countDocuments(),
    countMessages: await MessageModel.countDocuments(),
    ...space,
    users: users.map((v) => ({
      activationLink: find.activationLink(v.activationKey),
      createdAt: v.createdAt,
      email: v.email,
      fullname: v.fullname,
      resetKeyLink: find.resetKeyLink(v.resetKey),
      resetKeyCreatedAt: find.resetKeyCreatedAt(v.resetKeyExpiresAt),
      resetKeyExpiresAt: v.resetKeyExpiresAt,
      role: v.platformRole,
      username: v.username
    }))
  }

  // cache platform health information in redis database
  logger.debug('caching statistics')
  rclient.cache(cacheKey, JSON.stringify(response), config.redis.durationLong)

  return res.status(200).json(response)
}
