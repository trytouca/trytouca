// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { processBinaryContent } from '../../models/index.js'
import { IUser } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

/**
 * Handles test results submitted by endpoints. We are only supporting
 * incoming data with flatbuffers format.
 *
 * For a submission to be successful, the following conditions must be true:
 *  - User must be a member of the specified teams
 *    or they must be owner or admin of the platform.
 *  - Suites specified in each team, must already be registered.
 *  - Batches specified in each suite must be open if they are registered.
 *  - Elements in each batch must have distinct names.
 */
export async function clientSubmit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tic = process.hrtime()

  // check that request has the right content-type

  if (req.get('Content-Type') !== 'application/octet-stream') {
    return next({
      errors: ['expected binary data'],
      status: 501
    })
  }
  logger.debug('%s: received request for result submission', user.username)

  const errors = await processBinaryContent(user, req.body)
  if (errors.length !== 0) {
    logger.warn('%s: failed to handle new submissions', user.username)
    errors.forEach((e) => logger.warn(e))
    return res.status(400).json({ errors })
  }

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled submissions in %d ms', user.username, toc.toFixed(0))
  return res.status(204).send()
}
