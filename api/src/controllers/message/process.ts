// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
// to be removed as part of "Synchronized Comparison" project

import { NextFunction, Request, Response } from 'express'

import { messageProcess } from '@/models/message'

export async function messageProcessCtrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { status, error } = await messageProcess(req.params.job, req.body)
  return error ? next({ status, errors: [error] }) : res.status(status).send()
}
