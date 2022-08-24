// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { messageProcess } from '@/models/message'

export async function messageProcessCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await messageProcess(req.params.message, req.body)
  } catch (err) {
    return next({ status: 500, errors: [err.message] })
  }
  return res.status(204).send()
}
