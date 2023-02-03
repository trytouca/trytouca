// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { processBinaryContent, SubmissionOptions } from '../../models/index.js'
import { IUser } from '../../schemas/index.js'
import { analytics, logger } from '../../utils/index.js'

export async function clientSubmit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const options: SubmissionOptions = {
    sync: req.header('x-touca-submission-mode') === 'sync'
  }
  const user = res.locals.user as IUser
  const tic = process.hrtime()

  if (!req.is('application/octet-stream')) {
    res.setHeader('Accept', 'application/octet-stream')
    return next({ errors: ['expected binary data'], status: 415 })
  }

  logger.debug('%s: received submission: %j', user.username, options)
  analytics.add_activity('client:submit', user, {
    agent: req.header('user-agent'),
    sync: options.sync
  })

  const results = await processBinaryContent(user, req.body, options)
  if ('errors' in results) {
    logger.warn('%s: failed to handle submissions', user.username)
    results.errors.forEach((e) => logger.warn(e))
    return next({ errors: results.errors, status: 400 })
  }

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled submission in %d ms', user.username, toc.toFixed(0))
  return results.doc ? res.status(200).json(results.doc) : res.status(204)
}
