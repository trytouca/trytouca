/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { config, configMgr } from '@/utils/config'
import logger from '@/utils/logger'
import * as minio from '@/utils/minio'
import { rclient } from '@/utils/redis'

/**
 *
 */
export async function platformHealth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cacheKey = 'platform-health'
  logger.debug('received health check request')

  // check if we recently obtained platform health information
  if (await rclient.isCached(cacheKey)) {
    logger.debug('returning health response from cache')
    const cachedResponseStr = await rclient.getCached<string>(cacheKey)
    const cachedResponse = JSON.parse(cachedResponseStr)
    return res.status(200).json(cachedResponse)
  }

  // check that minio and mongodb are up and running
  const minioConnection = await minio.status()
  const mongodbConnection = mongoose.connection.readyState === 1
  const response = {
    mail: configMgr.hasMailTransport(),
    ready: minioConnection && mongodbConnection,
    self_hosted: config.auth.googleClientId === undefined
  }

  // cache platform health information in redis database
  logger.debug('caching health response')
  rclient.cache(cacheKey, JSON.stringify(response))

  return res.status(200).json(response)
}
