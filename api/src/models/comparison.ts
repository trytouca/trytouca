// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

import * as Queues from '@/queues'
import { ComparisonModel, IComparisonDocument } from '@/schemas/comparison'
import { MessageModel } from '@/schemas/message'
import { MetaModel } from '@/schemas/meta'
import { config } from '@/utils/config'
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

export async function comparisonRemove(
  jobs: IComparisonDocument[]
): Promise<void> {
  try {
    // remove comparison processing jobs from the queue
    await Promise.allSettled(
      jobs.map((job) => Queues.comparison.queue.remove(job.id))
    )
    // remove JSON representation of comparison results from object storage
    await Promise.allSettled(
      jobs.map((job) => objectStore.removeComparison(job.contentId))
    )
    // remove documents from database
    await ComparisonModel.deleteMany({
      _id: { $in: jobs.map((elem) => elem._id) }
    })
    logger.silly('removed %d comparison jobs', jobs.length)
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
