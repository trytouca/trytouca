// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { ComparisonModel } from '@/schemas/comparison'
import { MessageModel } from '@/schemas/message'

type ObjectId = mongoose.Types.ObjectId
type ComparisonJob = {
  jobId: ObjectId
  dstBatchId: ObjectId
  dstMessageId: ObjectId
  srcBatchId: ObjectId
  srcMessageId: ObjectId
}
interface ComparisonQueryOutputItem extends ComparisonJob {
  dstContentId?: ObjectId
  srcContentId?: ObjectId
}
type MessageJob = {
  messageId: ObjectId
  batchId: ObjectId
}

async function messageListImpl() {
  const reservedAt = new Date()
  reservedAt.setSeconds(reservedAt.getSeconds() - 60)
  const result: MessageJob[] = await MessageModel.aggregate([
    {
      $match: {
        contentId: { $exists: false },
        $or: [
          { reservedAt: { $exists: false } },
          { reservedAt: { $lt: reservedAt } }
        ]
      }
    },
    { $limit: 100 },
    { $project: { _id: 0, messageId: '$_id', batchId: 1 } }
  ])
  await MessageModel.updateMany(
    { _id: { $in: result.map((v) => v.messageId) } },
    { $set: { reservedAt: new Date() } }
  )
  return result
}

async function comparisonListImpl() {
  const reservedAt = new Date()
  reservedAt.setSeconds(reservedAt.getSeconds() - 60)
  const queryOutput: ComparisonQueryOutputItem[] =
    await ComparisonModel.aggregate([
      {
        $match: {
          processedAt: { $exists: false },
          contentId: { $exists: false },
          $or: [
            { reservedAt: { $exists: false } },
            { reservedAt: { $lt: reservedAt } }
          ]
        }
      },
      { $limit: 100 },
      {
        $lookup: {
          from: 'messages',
          localField: 'dstMessageId',
          foreignField: '_id',
          as: 'dstMessage'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'srcMessageId',
          foreignField: '_id',
          as: 'srcMessage'
        }
      },
      {
        $project: {
          dstId: { $arrayElemAt: ['$dstMessage', 0] },
          srcId: { $arrayElemAt: ['$srcMessage', 0] }
        }
      },
      {
        $project: {
          _id: 0,
          jobId: '$_id',
          dstBatchId: '$dstId.batchId',
          dstContentId: '$dstId.contentId',
          dstMessageId: '$dstId._id',
          srcContentId: '$srcId.contentId',
          srcBatchId: '$srcId.batchId',
          srcMessageId: '$srcId._id'
        }
      }
    ])
  const result = queryOutput
    .filter((v) => v.dstContentId && v.srcContentId)
    .map((v) => {
      const { dstContentId, srcContentId, ...job } = v
      return job
    })
  await ComparisonModel.updateMany(
    { _id: { $in: result.map((v) => v.jobId) } },
    { $set: { reservedAt: new Date() } }
  )
  return result
}

export async function comparisonList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const messages = await messageListImpl()
  const comparisons = await comparisonListImpl()
  return res.status(200).json({ messages, comparisons })
}
