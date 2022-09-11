// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { relay } from '@/models/relay'
import { MetaModel } from '@/schemas/meta'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

export async function platformInstall(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const contact = {
    company: req.body.company,
    email: req.body.email,
    name: req.body.name,
    uuid: uuidv4()
  }
  if (['company', 'email', 'name'].every((key) => !(key in contact))) {
    return next({
      status: 400,
      errors: ['invalid request']
    })
  }

  if (await MetaModel.countDocuments({ contact: { $exists: true } })) {
    return next({
      status: 403,
      errors: ['server is registered']
    })
  }

  // Note the use of upsert here. Normally, the Meta document is created
  // during startup. But during development, sometimes we clear the database,
  // that removes this document.
  await MetaModel.updateOne({}, { $set: { contact } }, { upsert: true })
  const response = await relay({
    path: '/relay/install',
    data: JSON.stringify(contact)
  })
  logger.info('server registered')
  rclient.removeCached('platform-config')
  rclient.removeCached('platform-health')

  return res.status(response.status).send()
}
