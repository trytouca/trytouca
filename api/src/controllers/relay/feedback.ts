// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { relay } from '../../models/relay.js'
import { wslFindByRole } from '../../models/user.js'
import { logger, mailUser } from '../../utils/index.js'

export async function feedbackSubmit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const response = await relay({
    path: '/relay/feedback',
    data: JSON.stringify(req.body)
  })
  return res.status(response.status).send()
}

export async function feedbackHandle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.debug('processing user feedback')
  const content = req.body as {
    body: string
    name: string
    page: string
    email: string
    cname: string
  }
  const owners = await wslFindByRole('owner')
  await mailUser(owners[0], 'New User Feedback', 'user-feedback', {
    body: content.body,
    name: content.name,
    page: content.page,
    email: content.email || 'noreply@touca.io',
    cname: content.cname || 'N/A'
  })
  logger.info('processed user feedback')
  return res.status(204).send()
}
