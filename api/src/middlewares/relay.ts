// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { config } from '../utils/index.js'

export function isCloudInstance(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  return config.isCloudHosted
    ? next()
    : next({ errors: ['exclusive route for cloud instance'], status: 403 })
}
