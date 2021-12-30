// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import {
  CommentInputs,
  extractCommentTuple,
  extractCommentType,
  notifySubscribers
} from '@/models/comment'
import { CommentModel, ICommentDocument } from '@/schemas/comment'
import { IUser } from '@/schemas/user'
import { ECommentType } from '@/types/backendtypes'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'
import { tracker } from '@/utils/tracker'

export async function ctrlCommentReply(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const comment = res.locals.comment as ICommentDocument
  const locals = res.locals as CommentInputs
  const text = req.body.body
  const tuple = extractCommentTuple(res)
  const type = extractCommentType(res)
  const user = res.locals.user as IUser
  logger.debug('%s: %s: replying to comment', user.username, tuple)

  if (comment.parentId) {
    return next({
      errors: ['replying to replies not allowed'],
      status: 400
    })
  }

  const newComment = await CommentModel.create({
    at: new Date(),
    batchId: type === ECommentType.Batch ? locals.batch._id : undefined,
    by: user._id,
    elementId: type === ECommentType.Element ? locals.element._id : undefined,
    parentId: comment._id,
    suiteId: type === ECommentType.Suite ? locals.suite._id : undefined,
    text,
    type
  })
  logger.info('%s: %s: replied to comment', user.username, tuple)

  // remove information about list of comments from cache.
  // we wait for this operation to avoid race condition.

  await rclient.removeCached(`route_commentList_${tuple}`)

  // notify all subscribers of this suite of the new comment.

  // @todo remove this branch when expanding support to suites and elements.
  if (newComment.type !== ECommentType.Batch) {
    return res.status(204).send()
  }

  const batchLink = [
    config.webapp.root,
    '~',
    locals.team.slug,
    locals.suite.slug,
    locals.batch.slug
  ].join('/')
  const commentLink = `${batchLink}?t=comments`
  const subject = `New Comment on Version ${locals.batch.slug} of Suite "${locals.suite.slug}"`
  const inputs = {
    batchLink,
    batchName: locals.batch.slug,
    commentAt: newComment.at,
    commentBy: null,
    commentBody: newComment.text,
    commentLink,
    headerColor: '#5e6ebf',
    subject,
    suiteName: locals.suite.name,
    teamName: locals.team.name,
    template: 'batch-comment',
    username: null
  }

  notifySubscribers(inputs, locals)
  tracker.track(user, 'comment_reply')
  return res.status(204).send()
}
