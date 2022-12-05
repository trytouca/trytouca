// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import bcrypt from 'bcryptjs'
import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash-es'

import { findPlatformRole } from '../../middlewares/index.js'
import { createUserAccount } from '../../models/auth.js'
import { MetaModel, UserModel } from '../../schemas/index.js'
import { config, redisClient } from '../../utils/index.js'

/**
 * Update settings of this server instance.
 */
export async function platformUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Prohibit non-admin users to change server settings unless they are in the
  // process of setting up their self-hosted instance. The identify the latter
  // case, we check whether there is a user account with role `owner`.
  const platformRole = await findPlatformRole(req)
  const isAdmin = platformRole === 'admin' || platformRole === 'owner'
  const isConfigured = !!(await UserModel.countDocuments({
    platformRole: 'owner'
  }))
  if (isConfigured && !isAdmin) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  const payload = pick(req.body, ['telemetry', 'contact', 'mail'])
  const before = await MetaModel.findOneAndUpdate({}, { $set: payload })

  const credentials = pick(req.body.credentials, ['username', 'password'])
  if (!isConfigured && credentials.username && credentials.password) {
    const user = await createUserAccount({
      email: before.contact.email,
      name: before.contact.name,
      ip_address: '127.0.0.1'
    })
    await UserModel.findByIdAndUpdate(user._id, {
      $set: {
        username: credentials.username,
        password: await bcrypt.hash(
          credentials.password,
          config.auth.bcryptSaltRound
        )
      }
    })
  }

  redisClient.removeCached('platform-config')
  redisClient.removeCached('platform-health')
  return res.status(204).send()
}
