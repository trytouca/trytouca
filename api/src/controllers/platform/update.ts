// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash'

import { findPlatformRole } from '@/middlewares'
import { createUserAccount } from '@/models/auth'
import { MetaModel } from '@/schemas/meta'
import { EPlatformRole } from '@touca/api-types'
import { rclient } from '@/utils/redis'

/**
 * Update settings of this server instance.
 */
export async function platformUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAdmin = [EPlatformRole.Admin, EPlatformRole.Owner].includes(
    await findPlatformRole(req)
  )
  const isConfigured = !!(await MetaModel.countDocuments({
    telemetry: { $exists: true }
  }))
  if (isConfigured && !isAdmin) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  const payload = pick(req.body, ['telemetry', 'contact'])
  const before = await MetaModel.findOneAndUpdate({}, { $set: payload })

  const after = await MetaModel.findOne({}, { contact: true, telemetry: true })
  if (
    'telemetry' in payload &&
    before?.telemetry === undefined &&
    after?.contact
  ) {
    const user = await createUserAccount({
      email: after.contact.email,
      ip_address: '127.0.0.1'
    })
    return res.status(200).json({ url: user.activationKey })
  }

  rclient.removeCached('platform-config')
  rclient.removeCached('platform-health')
  return res.status(204).send()
}
