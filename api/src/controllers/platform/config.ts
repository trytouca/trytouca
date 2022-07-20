// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { PlatformConfig } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { findPlatformRole } from '@/middlewares'
import { MetaModel } from '@/schemas/meta'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

export async function platformConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const platformRole = await findPlatformRole(req)
  const isAdmin = platformRole === 'admin' || platformRole === 'owner'
  const isConfigured = !!(await MetaModel.countDocuments({
    telemetry: { $exists: true }
  }))
  if (isConfigured && !isAdmin) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

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
  if (meta?.contact) {
    response.contact = meta.contact
  }
  if (meta?.mail) {
    response.mail = meta.mail
  } else if (config.mail.host) {
    response.mail = {
      host: config.mail.host,
      pass: config.mail.pass,
      port: config.mail.port,
      user: config.mail.user
    }
  }

  // cache response
  logger.debug('caching response for platform config')
  rclient.cache(cacheKey, JSON.stringify(response))

  return res.status(200).json(response)
}
