// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { PlatformConfig } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { findPlatformRole } from '../../middlewares/index.js'
import { MetaModel } from '../../schemas/index.js'
import {
  hasMailTransportEnvironmentVariables,
  logger
} from '../../utils/index.js'

export async function platformConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.debug('received request to show server settings')
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

  // prepare response

  const meta = await MetaModel.findOne(
    {},
    { contact: 1, mail: 1, telemetry: 1 }
  )
  const response: PlatformConfig = {
    contact: meta?.contact,
    mail: meta?.mail
      ? {
          configurable: !hasMailTransportEnvironmentVariables(),
          host: meta.mail.host,
          pass: meta.mail.pass,
          port: meta.mail.port,
          user: meta.mail.user
        }
      : undefined,
    telemetry: meta?.telemetry
  }
  return res.status(200).json(response)
}
