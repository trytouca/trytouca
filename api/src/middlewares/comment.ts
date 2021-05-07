/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { IBatchDocument } from '@weasel/schemas/batch'
import { CommentModel } from '@weasel/schemas/comment'
import { ECommentType } from '@weasel/types/backendtypes'
import { NextFunction, Request, Response } from 'express'

/**
 * @summary
 * Checks if a comment exists.
 *
 * @description
 * Checks if a comment whose id is specified in as request param `comment`
 * exists and belongs to the specified batch.
 *
 * - Populates local response variables: `comment`.
 * - Expects request body variables: N/A
 * - Expects request parameters: `comment`
 * - Expects local response variables: `comment`, `team`, `suite`, `batch`
 * - Database Queries: 1
 *
 * @returns
 * - Error 404 if comment with id (`comment`) is not registered.
 */
export async function hasComment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const comment = await CommentModel.findById(req.params.comment)

  // return 404 if comment with specified id does not exist

  if (!comment) {
    return next({
      errors: ['comment not found'],
      status: 404
    })
  }

  // @todo generalize the following check to extend middleware support
  // to comments on all pages.

  const batch = res.locals.batch as IBatchDocument
  const isOwned =
    comment.type === ECommentType.Batch && comment.batchId.equals(batch._id)
  if (!isOwned) {
    return next({
      errors: ['comment not found'],
      status: 404
    })
  }

  res.locals.comment = comment
  return next()
}
