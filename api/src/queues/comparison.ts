// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { compare } from '@touca/comparator'
import { deserialize } from '@touca/flatbuffers'

import { ComparisonJob, comparisonProcess } from '@/models/comparison'
import { ComparisonModel } from '@/schemas/comparison'
import logger from '@/utils/logger'
import {
  createQueue,
  createQueueScheduler,
  createWorker,
  PerformanceMarks
} from '@/utils/queue'
import { objectStore } from '@/utils/store'

async function processor(job: ComparisonJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  const srcBuffer = await objectStore.getMessage(job.srcMessageId.toString())
  const dstBuffer = await objectStore.getMessage(job.dstMessageId.toString())
  perf.mark('object_store:fetch')
  const srcMessage = deserialize(srcBuffer)
  const dstMessage = deserialize(dstBuffer)
  perf.mark('flatbuffers:deserialize')
  const output = compare(srcMessage, dstMessage)
  perf.mark('comparator:compare')
  const { error } = await comparisonProcess(job.jobId.toString(), output)
  perf.mark('comparison:process')
  return error ? Promise.reject(error) : perf
}

export async function start() {
  const queryOutput = await ComparisonModel.aggregate([
    {
      $match: {
        processedAt: { $exists: false },
        contentId: { $exists: false }
      }
    },
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
  const jobs: ComparisonJob[] = queryOutput.map((v) => ({
    jobId: v.jobId,
    dstBatchId: v.dstBatchId,
    dstMessageId: v.dstMessageId,
    srcBatchId: v.srcBatchId,
    srcMessageId: v.srcMessageId
  }))
  logger.info('inserting %d jobs into comparisons queue', jobs.length)
  await queue.addBulk(
    jobs.map((job) => ({
      name: job.jobId.toHexString(),
      data: job,
      opts: {
        jobId: job.jobId.toHexString()
      }
    }))
  )
}

export const queue = createQueue('comparisons')
export const worker = createWorker('comparisons', processor)
export const scheduler = createQueueScheduler('comparisons')
