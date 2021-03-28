/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * helper function that allows the controller function to be async
 */
export function promisable(fn: RequestHandler, msg: string) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch((err) =>
      next({ errors: [`failed to ${msg}: ${err}`] })
    )
}
