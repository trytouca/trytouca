/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import marked from 'marked'

import { wslFindByUname } from '@weasel/models/user'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'

/**
 *
 */
export async function feedback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const feedback = req.body as { body: string; name: string; page: string }
  logger.debug('received request to relay user feedback')

  // notify administrators of the user feedback
  // we are intentionally not awaiting on this operation

  const superuser = await wslFindByUname('weasel')
  mailer.mailUser(superuser, 'New User Feedback', 'user-feedback', {
    username: feedback.name,
    page: feedback.page,
    body: marked(feedback.body)
  })

  return res.status(204).send()
}
