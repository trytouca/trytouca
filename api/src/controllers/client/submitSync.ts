// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { processBinaryContentSync } from '../../models/submitSync.js'
import { IUser } from '../../schemas/index.js'
import { analytics, logger } from '../../utils/index.js'

export async function clientSubmitSync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const timestamp = Date.now()
  const user = res.locals.user as IUser

  if (!req.is('application/octet-stream')) {
    res.setHeader('Accept', 'application/octet-stream')
    return next({ status: 415 })
  }

  logger.debug('%s: received submission (sync)', user.username)

  analytics.add_activity('client:submit_sync', user, {
    agent: req.header('user-agent')
  })

  const result = await processBinaryContentSync(user, req.body)

  if (result.type == 'failure') {
    logger.warn('%s: failed to handle submission (sync)', user.username)
    return next({ status: result.status, errors: [result.error] })
  }

  logger.info(
    '%s: handled submission in %d ms (sync)',
    user.username,
    Date.now() - timestamp
  )

  return res.status(200).send(result.data)
}
