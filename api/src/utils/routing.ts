/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express'

import logger from './logger'

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
 * Connects to a given server while handling failures.
 *
 * @param cb callback function with connection logic
 * @param name name of the container to connect to
 * @param maxAttempts maximum number of times to attempt to connect to server
 * @param timeout maximum amount of time (ms) to between attempts to connect to server
 */
export async function connectToServer(
  cb: () => Promise<unknown>,
  name = 'server',
  maxAttempts = 12,
  timeout = 5000
) {
  // If connection fails, periodically attempt to connect again every
  // `timeout` milliseconds for as many as `maxAttempts` times until
  // the connection is successful.

  for (let i = 1; i <= maxAttempts; i++) {
    try {
      if (await cb()) {
        logger.info('successfully connected to %s', name)
        return true
      }
    } catch (err) {
      logger.debug('error when connecting to %s', name)
    }
    logger.warn('failed to connect to %s (%d/%d)', name, i, maxAttempts)
    const delay = (ms: number) => new Promise((v) => setTimeout(v, ms))
    await delay(timeout)
  }

  // if we failed to connect after exhausting all of our attempts
  // assume that the container is down or has a fatal startup failure
  // in which case we cannot continue.

  logger.error('exhausted attempts to connect to %s', name)
  return false
}
