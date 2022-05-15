// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { MetaModel } from '@/schemas/meta'
import { PlatformConfig } from '@/types/commontypes'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

export async function platformConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cacheKey = 'platform-config'
  logger.debug('received request to show platform config')

  // check if response is cached
  if (await rclient.isCached(cacheKey)) {
    logger.debug('returning response for platform config from cache')
    const cachedResponseStr = await rclient.getCached<string>(cacheKey)
    const cachedResponse = JSON.parse(cachedResponseStr)
    return res.status(200).json(cachedResponse)
  }

  // prepare response
  const meta = await MetaModel.findOne({}, { contact: 1, mail: 1 })
  const response: PlatformConfig = {}
  if (meta.contact) {
    response.contact = meta.contact
  }
  if (meta.mail) {
    response.mail = meta.mail
  } else {
    response.mail = {
      host: config.mail.host,
      pass: config.mail.pass,
      port: config.mail.port ?? 587,
      user: config.mail.user
    }
  }

  // cache response
  logger.debug('caching response for platform config')
  rclient.cache(cacheKey, JSON.stringify(response))

  return res.status(200).json(response)
}
