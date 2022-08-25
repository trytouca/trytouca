// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { parseComparison, parseMessage } from '@touca/fbs-schema'

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

async function processMessageJob(job: MessageJob) {
  logger.debug('m:%s: processing', job.messageId)
  const tic = Date.now()
  const message = await objectStore.getMessage(job.messageId.toString())
  const output = await parseMessage(message)
  const { error } = await messageProcess(job.messageId.toString(), output)
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
  const dstMessage = await objectStore.getMessage(job.dstMessageId.toString())
  const srcMessage = await objectStore.getMessage(job.srcMessageId.toString())
  const output = await parseComparison(srcMessage, dstMessage)
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
