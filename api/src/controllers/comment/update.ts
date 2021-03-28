/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { extractCommentTuple } from '@weasel/models/comment'
import { CommentModel, ICommentDocument } from '@weasel/schemas/comment'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'

/**
 *
 */
export async function ctrlCommentUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const comment = res.locals.comment as ICommentDocument
  const tuple = extractCommentTuple(res)
  logger.debug('%s: %s: editing comment', user.username, tuple)

  if (!comment.by.equals(user._id)) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }
  logger.silly('%s: can edit comment %s', user.username, comment._id)

  await CommentModel.findByIdAndUpdate(comment._id, {
    editedAt: new Date(),
    text: req.body.body
  })

  // remove information about list of comments from cache.
  // we wait for this operation to avoid race condition.

  await rclient.removeCached(`route_commentList_${tuple}`)

  logger.info('%s: %s: edited comment', user.username, tuple)
  return res.status(204).send()
}
