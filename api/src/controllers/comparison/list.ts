/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { ComparisonModel } from '../../schemas/comparison'

/**
 *
 */
export async function comparisonListImpl() {
  const result = await ComparisonModel.aggregate([
    {
      $match: {
        processedAt: { $exists: false }, elasticId: { $exists: false }
      }
    },
    { $limit: 100 },
    {
      $lookup: {
        from: 'messages',
        localField: 'dstMessageId',
        foreignField: '_id',
        as: 'dstMessageDoc',
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'srcMessageId',
        foreignField: '_id',
        as: 'srcMessageDoc',
      }
    },
    {
      $project: {
        dstBatchId: 1,
        dstMessageId: 1,
        dstProcessed: { $arrayElemAt: [ '$dstMessageDoc.elasticId', 0 ] },
        srcBatchId: 1,
        srcMessageId: 1,
        srcProcessed: { $arrayElemAt: [ '$srcMessageDoc.elasticId', 0 ] }
      }
    }
  ])

  return result.map(v => ({
    _id: v._id,
    dstBatch: v.dstBatchId,
    dstMessage: v.dstMessageId,
    dstProcessed: Boolean(v.dstProcessed),
    srcBatch: v.srcBatchId,
    srcMessage: v.srcMessageId,
    srcProcessed: Boolean(v.srcProcessed)
  }))
}

/**
 *
 */
export async function comparisonList(
  req: Request, res: Response, next: NextFunction
) {
  const jobs = await comparisonListImpl()
  return res.status(200).json(jobs)
}
