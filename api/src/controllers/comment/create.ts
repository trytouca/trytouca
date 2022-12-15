// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import {
  CommentInputs,
  extractCommentTuple,
  extractCommentType,
  notifySubscribers
} from '../../models/index.js'
import { CommentModel, IUser } from '../../schemas/index.js'
import { ECommentType } from '../../types/index.js'
import { analytics, config, logger, redisClient } from '../../utils/index.js'

export async function ctrlCommentCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const locals = res.locals as CommentInputs
  const text = req.body.body
  const tuple = extractCommentTuple(res)
  const type = extractCommentType(res)
  const user = res.locals.user as IUser
  logger.info('%s: %s: creating comment', user.username, tuple)

  const comment = await CommentModel.create({
    at: new Date(),
    batchId: type === ECommentType.Batch ? locals.batch._id : undefined,
    by: user._id,
    elementId: type === ECommentType.Element ? locals.element._id : undefined,
    suiteId: type === ECommentType.Suite ? locals.suite._id : undefined,
    text,
    type
  })
  logger.info('%s: %s: created comment', user.username, tuple)

  // remove information about list of comments from cache.
  // we wait for this operation to avoid race condition.

  await redisClient.removeCached(`route_commentList_${tuple}`)

  // notify all subscribers of this suite of the new comment.

  // @todo remove this branch when expanding support to suites and elements.
  if (comment.type !== ECommentType.Batch) {
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
    commentAt: comment.at,
    commentBy: null,
    commentBody: comment.text,
    commentLink,
    headerColor: '#5e6ebf',
    subject,
    suiteName: locals.suite.name,
    teamName: locals.team.name,
    template: 'batch-comment',
    username: null
  }

  notifySubscribers(inputs, locals)
  analytics.add_activity('comment:created', user)

  return res.status(204).send()
}
