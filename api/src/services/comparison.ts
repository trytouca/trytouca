// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { compare, stringifyValue } from '@touca/comparator'
import { deserialize, Message } from '@touca/flatbuffers'

import {
  ComparisonJob,
  comparisonProcess,
  getComparisonJobs,
  MessageJob,
  updateComparisonStats
} from '@/models/comparison'
import { messageProcess } from '@/models/message'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

export type MessageOverview = {
  keysCount: number
  metricsCount: number
  metricsDuration: number
}

export type MessageTransformed = {
  metadata: Message['metadata']
  metrics: {
    name: string
    value: string
  }[]
  results: {
    name: string
    value: string
  }[]
}

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
      name: v.name,
      value: stringifyValue(v.value)
    })),
    results: message.results.map((v) => ({
      name: v.name,
      value: stringifyValue(v.value)
    }))
  }
}

async function processMessageJob(job: MessageJob) {
  logger.debug('m:%s: processing', job.messageId)
  const tic = Date.now()
  const buffer = await objectStore.getMessage(job.messageId.toString())
  const message = deserialize(buffer)
  const { error } = await messageProcess(job.messageId.toString(), {
    overview: buildMessageOverview(message),
    body: transform(message)
  })
  if (error) {
    logger.warn('m:%s: failed to process job: %s', job.messageId, error)
    return Promise.reject(error)
  }
  const duration = Date.now() - tic
  logger.info('m:%s: processed (%d ms)', job.messageId, duration)
  return duration
}

async function processComparisonJob(job: ComparisonJob) {
  logger.debug('c:%s: processing', job.jobId)
  const tic = Date.now()
  const dstBuffer = await objectStore.getMessage(job.dstMessageId.toString())
  const srcBuffer = await objectStore.getMessage(job.srcMessageId.toString())
  const dstMessage = deserialize(dstBuffer)
  const srcMessage = deserialize(srcBuffer)
  const output = compare(dstMessage, srcMessage)
  const { error } = await comparisonProcess(job.jobId.toString(), output)
  if (error) {
    logger.warn('c:%s: failed to process job: %s', job.jobId, error)
    return Promise.reject(error)
  }
  const duration = Date.now() - tic
  logger.info('c:%s: processed (%d ms)', job.jobId, duration)
  return duration
}

export async function comparisonService(): Promise<void> {
  const serviceName = 'service comparison'
  logger.silly('%s: running', serviceName)
  const tic = Date.now()
  const jobs = await getComparisonJobs()
  const tasks = [
    ...jobs.messages.map((v) => () => processMessageJob(v)),
    ...jobs.comparisons.map((v) => () => processComparisonJob(v))
  ]
  if (!tasks.length) {
    return
  }
  logger.info('%s: received %d comparison jobs', serviceName, tasks.length)
  const numCollectionJobs = tasks.length
  const avgCollectionTime = (Date.now() - tic) / tasks.length
  const output = await Promise.allSettled(tasks.map(async (v) => await v()))
  output
    .filter((v) => v.status === 'rejected')
    .forEach((v: PromiseRejectedResult) => {
      logger.warn(
        '%s: failed to process comparison job: %s',
        serviceName,
        v.reason
      )
    })
  const resolved = output
    .filter((v) => v.status === 'fulfilled')
    .map((v: any) => v.value)
  const avgProcessingTime =
    resolved.reduce((sum, cur) => sum + cur, 0) / tasks.length
  const numProcessingJobs = resolved.length
  await updateComparisonStats({
    numCollectionJobs,
    avgCollectionTime,
    avgProcessingTime,
    numProcessingJobs
  })
}
