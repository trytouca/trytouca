// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { extractCommentTuple, extractCommentType } from '@/models/comment'
import { CommentModel } from '@/schemas/comment'
import { IUser } from '@/schemas/user'
import { CommentListQueryOutput, ECommentType } from '@/types/backendtypes'
import type { CommentItem, CommentListResponse } from '@touca/api-schema'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

async function commentList(res: Response): Promise<CommentListResponse> {
  const type = extractCommentType(res)
  const matchQuery = {
    elementId:
      type === ECommentType.Element ? res.locals.element._id : undefined,
    batchId: type === ECommentType.Batch ? res.locals.batch._id : undefined,
    suiteId: type === ECommentType.Suite ? res.locals.suite._id : undefined
  }

  const queryOutput: CommentListQueryOutput[] = await CommentModel.aggregate([
    { $match: matchQuery },
    { $sort: { at: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'by',
        foreignField: '_id',
        as: 'byDoc'
      }
    },
    {
      $project: {
        at: 1,
        byDoc: {
          username: 1,
          fullname: 1
        },
        editedAt: 1,
        parentId: 1,
        text: 1
      }
    },
    { $unwind: '$byDoc' },
    {
      $project: {
        at: 1,
        by: '$byDoc',
        editedAt: 1,
        parentId: 1,
        text: 1
      }
    }
  ])

  type Transformed = CommentItem & {
    parentId: CommentListQueryOutput['parentId']
  }
  const transform = (v: CommentListQueryOutput): Transformed => ({
    at: v.at,
    by: v.by,
    id: v._id.toHexString(),
    editedAt: v.editedAt,
    parentId: v.parentId,
    replies: [],
    text: v.text
  })
  const children = queryOutput.filter((v) => v.parentId).map(transform)
  const parents = queryOutput.filter((v) => !v.parentId).map(transform)
  const output = parents.map((v) => {
    const replies = children.filter((e) => e.parentId.toHexString() === v.id)
    replies.forEach((e) => (e.replies = undefined))
    replies.sort((a, b) => +new Date(a.at) - +new Date(b.at))
    v.replies = replies
    return v
  })
  return output
}

export async function ctrlCommentList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tuple = extractCommentTuple(res)

  logger.debug('%s: %s: listing comments', user.username, tuple)
  const cacheKey = `route_commentList_${tuple}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const output = await commentList(res)

  // cache list result

  rclient.cache(cacheKey, output)

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
