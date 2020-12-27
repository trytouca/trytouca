/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ComparisonModel } from '../../schemas/comparison'
import { MessageModel } from '../../schemas/message';

type ObjectId = mongoose.Types.ObjectId
type ComparisonJob = {
  jobId: ObjectId
  dstBatchId: ObjectId
  dstMessageId: ObjectId
  srcBatchId: ObjectId
  srcMessageId: ObjectId
}
type MessageJob = {
  messageId: ObjectId,
  batchId: ObjectId
}

/**
 *
 */
export async function messageListImpl() {
  const reservedAt = new Date()
  reservedAt.setSeconds(reservedAt.getSeconds() - 60);
  const result: MessageJob[] = await MessageModel.aggregate([
    { $match: { elasticId: { $exists: false } } },
    {
      $match: {
        $or: [
          { reservedAt: { $exists: false } },
          { reservedAt: { $lt: reservedAt } }
        ]
      }
    },
    { $limit: 10 },
    { $project: { _id: 0, messageId: '$_id', batchId: 1 } }
  ])
  await MessageModel.updateMany(
    { _id: { $in: result.map(v => v.messageId) } },
    { $set: { reservedAt: new Date() } }
  )
  return result
}

/**
 *
 */
export async function comparisonListImpl() {
  const reservedAt = new Date()
  reservedAt.setSeconds(reservedAt.getSeconds() - 60);
  const result: ComparisonJob[] = await ComparisonModel.aggregate([
    {
      $match: {
        processedAt: { $exists: false },
        elasticId: { $exists: false }
      }
    },
    {
      $match: {
        $or: [
          { reservedAt: { $exists: false } },
          { reservedAt: { $lt: reservedAt } }
        ]
      }
    },
    { $limit: 10 },
    {
      $lookup: {
        from: 'messages',
        let: { dstId: '$dstMessageId', srcId: '$srcMessageId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: [ '$_id', '$$dstId' ] },
                  { $eq: [ '$_id', '$$srcId' ] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 0,
              processedAt: {
                $cond: [
                  { $ifNull: ['$elasticId', false ] },
                  true,
                  false
                ]
              }
            }
          },
        ],
        as: 'messages'
      }
    },
    {
      $project: {
        jobId: '$_id',
        dstBatchId: 1,
        dstMessageId: 1,
        srcBatchId: 1,
        srcMessageId: 1,
        isComparable: { $allElementsTrue: '$messages.processedAt' }
      }
    },
    { $match: { isComparable: true } },
    { $project: { isComparable: 0 } }
  ])
  await ComparisonModel.updateMany(
    { _id: { $in: result.map(v => v.jobId) } },
    { $set: { reservedAt: new Date() } }
  )
  return result
}

/**
 *
 */
export async function comparisonList(
  req: Request, res: Response, next: NextFunction
) {
  const messages = await messageListImpl()
  const comparisons = await comparisonListImpl()
  return res.status(200).json({ messages, comparisons })
}
