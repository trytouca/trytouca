/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { configMgr } from '../../utils/config'
import * as elastic from '../../utils/elastic'
import logger from '../../utils/logger'
import { rclient } from '../../utils/redis'

/**
 * @todo add version field in response whose value matches output of
 *       git describe on platform source repository.
 * @todo add size of elasticsearch and mongodb databases
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

  // check elasticsearch and mongodb databases are up and running
  const elasticConnection = await elastic.status()
  const mongodbConnection = mongoose.connection.readyState === 1
  const response = {
    mail: configMgr.hasMailTransport(),
    ready: elasticConnection && mongodbConnection
  }

  // cache platform health information in redis database
  logger.debug('caching health response')
  rclient.cache(cacheKey, JSON.stringify(response))

  return res.status(200).json(response)
}
