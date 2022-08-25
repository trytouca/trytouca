// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

import { ComparisonModel, IComparisonDocument } from '@/schemas/comparison'
import { MessageModel } from '@/schemas/message'
import { MetaModel } from '@/schemas/meta'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

type ObjectId = mongoose.Types.ObjectId
export type ComparisonJob = {
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
export type MessageJob = {
  messageId: ObjectId
  batchId: ObjectId
}

async function getMessageProcessingJobs() {
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

async function getComparisonProcessingJobs() {
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

export async function getComparisonJobs() {
  return {
    messages: await getMessageProcessingJobs(),
    comparisons: await getComparisonProcessingJobs()
  }
}

export async function comparisonRemove(
  jobs: IComparisonDocument[]
): Promise<void> {
  try {
    // remove comparison results from object storage

    const removal = jobs.map((job) =>
      objectStore.removeComparison(job.contentId)
    )
    await Promise.all(removal)
    logger.debug('removed %d comparison results', jobs.length)

    // remove processed comparison jobs

    const jobIds = jobs.map((elem) => elem._id)
    await ComparisonModel.deleteMany({ _id: { $in: jobIds } })
    logger.debug('removed %d processed comparison jobs', jobs.length)
  } catch (err) {
    logger.warn('failed to remove comparison jobs: %s', err)
  }
}

export async function comparisonProcess(
  jobId,
  input
): Promise<{ status: number; error?: string }> {
  // we expect that comparison job exists
  const comparison = await ComparisonModel.findById(jobId)
  if (!comparison) {
    return { status: 404, error: 'comparison job not found' }
  }
  // we expect that comparison job is not already processed
  if (comparison.contentId) {
    return { status: 409, error: 'comparison job already processed' }
  }
  // insert comparison result in json format into object storage
  const doc = await objectStore.addComparison(
    comparison._id.toHexString(),
    JSON.stringify(input.body, null)
  )
  if (!doc) {
    return { status: 500, error: 'failed to handle comparison result' }
  }
  // mark comparison job as processed
  await ComparisonModel.findByIdAndUpdate(jobId, {
    $set: {
      processedAt: new Date(),
      contentId: comparison._id,
      meta: input.overview
    },
    $unset: { reservedAt: true }
  })
  return { status: 204 }
}

export async function updateComparisonStats(input: {
  avgCollectionTime: number
  avgProcessingTime: number
  numCollectionJobs: number
  numProcessingJobs: number
}) {
  logger.debug('received comparison statistics: %j', input)

  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
  }

  const meta = await MetaModel.findOne()

  if (0 < input.numCollectionJobs) {
    const jobs = meta.cmpNumCollectionJobs + input.numCollectionJobs
    const previous = meta.cmpAvgCollectionTime * meta.cmpNumCollectionJobs
    const incoming = input.avgCollectionTime * input.numCollectionJobs
    meta.cmpAvgCollectionTime = (previous + incoming) / jobs
    meta.cmpNumCollectionJobs += input.numCollectionJobs
  }

  if (0 < input.numProcessingJobs) {
    const jobs = meta.cmpNumProcessingJobs + input.numProcessingJobs
    const previous = meta.cmpAvgProcessingTime * meta.cmpNumProcessingJobs
    const incoming = input.avgProcessingTime * input.numProcessingJobs
    meta.cmpAvgProcessingTime = (previous + incoming) / jobs
    meta.cmpNumProcessingJobs += input.numProcessingJobs
  }

  await MetaModel.updateOne({}, { $set: meta })
  logger.info('updated comparison statistics', input)
}
