// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { MetaModel } from '@/schemas/meta'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

/**
 * Updates server configuration.
 */
export async function platformUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
    logger.info('created meta document with default values')
  }

  if (!config.isCloudHosted) {
    await MetaModel.updateOne({}, { $set: { telemetry: req.body.telemetry } })
    rclient.removeCached('platform-health')
  }

  return res.status(204).send()
}
