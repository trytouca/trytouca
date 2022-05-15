// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

/**
 * Update settings of this server instance.
 */
export async function platformUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return res.status(204).send()
}
