// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { wslFindByUname } from '@/models/user'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'

/**
 *
 */
export async function feedback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const feedback = req.body as {
    body: string
    name: string
    page: string
    email: string
    cname: string
  }
  logger.info('received request to relay user message')

  // we are intentionally not awaiting on this operation

  const superuser = await wslFindByUname('touca')
  mailer.mailUser(superuser, 'New User Feedback', 'user-feedback', {
    body: feedback.body,
    name: feedback.name,
    page: feedback.page,
    email: feedback.email || 'noreply@touca.io',
    cname: feedback.cname || 'N/A'
  })

  return res.status(204).send()
}
