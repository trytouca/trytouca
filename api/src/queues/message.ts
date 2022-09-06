// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { stringify } from '@touca/comparator'
import { deserialize, Message } from '@touca/flatbuffers'

import { MessageJob } from '@/models/comparison'
import { messageProcess } from '@/models/message'
import { MessageModel } from '@/schemas/message'
import { MessageOverview, MessageTransformed } from '@/types/backendtypes'
import logger from '@/utils/logger'
import {
  createQueue,
  createQueueScheduler,
  createWorker,
  PerformanceMarks
} from '@/utils/queue'
import { objectStore } from '@/utils/store'

function buildMessageOverview(message: Message): MessageOverview {
  return {
    keysCount: message.results.length,
    metricsCount: message.metrics.length,
    metricsDuration: message.metrics.reduce(
      (sum, v) => sum + Number(v.value),
      0
    )
  }
}

function transform(message: Message): MessageTransformed {
  return {
    metadata: message.metadata,
    metrics: message.metrics.map((v) => ({
      key: v.key,
      value: stringify(v.value)
    })),
    results: message.results.map((v) => ({
      key: v.key,
      value: stringify(v.value)
    }))
  }
}

async function processor(job: MessageJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  const buffer = await objectStore.getMessage(job.messageId.toString())
  perf.mark('object_store:fetch')
  const message = deserialize(buffer)
  perf.mark('flatbuffers:deserialize')
  const { error } = await messageProcess(job.messageId.toString(), {
    overview: buildMessageOverview(message),
    body: transform(message)
  })
  perf.mark('message:process')
  return error ? Promise.reject(error) : perf
}

export async function start() {
  const jobs = await MessageModel.aggregate([
    { $match: { contentId: { $exists: false } } },
    { $project: { _id: 0, messageId: '$_id', batchId: 1 } }
  ])
  logger.info('inserting %d jobs into message queue', jobs.length)
  await queue.addBulk(
    jobs.map((job) => ({
      name: job.messageId.toHexString(),
      data: job,
      opts: {
        jobId: job.messageId.toHexString()
      }
    }))
  )
}

export const queue = createQueue('messages')
export const scheduler = createQueueScheduler('messages')
export const worker = createWorker('messages', processor)
