// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { relay } from '../../models/index.js'
import { MetaModel } from '../../schemas/index.js'
import { logger, redisClient } from '../../utils/index.js'

export async function platformInstall(
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.debug('received request to register this server instance')
  const contact = {
    company: req.body.company,
    email: req.body.email,
    name: req.body.name
  }
  if (['company', 'email', 'name'].every((key) => !(key in contact))) {
    return next({
      status: 400,
      errors: ['invalid request']
    })
  }

  const updateOptions = { upsert: true, new: true, setDefaultsOnInsert: true }
  const meta = await MetaModel.findOneAndUpdate({}, {}, updateOptions)
  if (meta.contact) {
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
    data: JSON.stringify({ ...contact, uuid: meta.uuid })
  })
  logger.info('server registered')
  redisClient.removeCached('platform-config')
  redisClient.removeCached('platform-health')

  return res.status(response.status).send()
}
