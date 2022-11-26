// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { UserModel } from '@/schemas/user'
import { configMgr } from '@/utils/config'
import logger from '@/utils/logger'
import { redisClient } from '@/utils/redis'
import { objectStore } from '@/utils/store'

export async function platformHealth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cacheKey = 'platform-health'
  logger.debug('received health check request')

  // check if we recently obtained platform health information
  if (await redisClient.isCached(cacheKey)) {
    logger.debug('returning health response from cache')
    const cachedResponseStr = await redisClient.getCached<string>(cacheKey)
    const cachedResponse = JSON.parse(cachedResponseStr)
    return res.status(200).json(cachedResponse)
  }

  // check that minio and mongodb are up and running
  const minioConnection = await objectStore.status()
  const mongodbConnection = mongoose.connection.readyState === 1
  const response = {
    mail: await configMgr.hasMailTransport(),
    ready: minioConnection && mongodbConnection,
    configured: !!(await UserModel.countDocuments({ platformRole: 'owner' }))
  }

  // cache platform health information in redis database
  logger.debug('caching health response')
  redisClient.cache(cacheKey, JSON.stringify(response))

  return res.status(200).json(response)
}
