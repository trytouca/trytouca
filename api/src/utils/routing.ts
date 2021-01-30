/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express'

import logger from '../utils/logger'
import { rclient } from '../utils/redis'

/**
 *
 */
async function cacheOperation(
  req: Request,
  res: Response,
  next: NextFunction,
  func: RequestHandler,
  cacheKey?: string
) {
  if (!cacheKey) {
    cacheKey = func.name
  }
  logger.silly('%s: received request', cacheKey)

  // if response is already cached, provide cached response

  const rkey = 'route_' + cacheKey
  if (await rclient.isCached(rkey)) {
    logger.debug('%s: from cache', rkey)
    const cached = await rclient.getCached(rkey)
    return res.status(200).json(cached)
  }

  const tic = process.hrtime()

  // perform operation

  const output = await func(req, res, next)

  if (!output) {
    return
  }

  // cache response for this request to avoid rerunning the same process
  // for near future requests.
  // note that we are allowing this operation to fail.

  rclient.cache(rkey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.silly('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}

/**
 * helper function that allows the controller function to be async
 */
export function promisable(fn: RequestHandler, msg: string) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch((err) =>
      next({ errors: [`failed to ${msg}: ${err}`] })
    )
}

/**
 *
 */
export function cacheable(fn: RequestHandler, cacheKey?: string) {
  return (req: Request, res: Response, next: NextFunction) =>
    cacheOperation(req, res, next, fn, cacheKey)
}
