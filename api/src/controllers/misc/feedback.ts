// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { relay } from '@/models/relay'
import { wslFindByRole } from '@/models/user'
import { EPlatformRole } from '@touca/api-schema'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'

export async function feedback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const content = req.body as {
    body: string
    name: string
    page: string
    email: string
    cname: string
  }
  logger.info('received request to relay user message')

  // we are intentionally not awaiting on this operation
  if (config.isCloudHosted) {
    const owners = await wslFindByRole(EPlatformRole.Owner)
    mailer.mailUser(owners[0], 'New User Feedback', 'user-feedback', {
      body: content.body,
      name: content.name,
      page: content.page,
      email: content.email || 'noreply@touca.io',
      cname: content.cname || 'N/A'
    })
    return res.status(204).send()
  }

  const response = await relay({
    path: '/feedback',
    data: JSON.stringify(content)
  })
  return res.status(response.status).send()
}
