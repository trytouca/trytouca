// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  ComparisonJob,
  getComparisonJobs,
  MessageJob
} from '@/models/comparison'
import logger from '@/utils/logger'

async function processMessageJob(job: MessageJob) {
  logger.debug('m:%s: processing', job.messageId)
  logger.info('m:%s: processed (%d ms)', job.messageId, 0)
}

async function processComparisonJob(job: ComparisonJob) {
  logger.debug('c:%s: processing', job.jobId)
  logger.info('c:%s: processed (%d ms)', job.jobId, 0)
  // jobId,
  // dstBatchId,
  // dstMessageId,
  // srcBatchId,
  // srcMessageId
}

export async function comparisonService(): Promise<void> {
  const serviceName = 'service comparison'
  logger.silly('%s: running', serviceName)

  const jobs = await getComparisonJobs()

  const jobsCount = jobs.comparisons.length + jobs.messages.length
  if (!jobsCount) {
    return
  }
  logger.info('%s: received %d comparison jobs', serviceName, jobsCount)

  const tasks = [
    ...jobs.messages.map((v) => () => processMessageJob(v)),
    ...jobs.comparisons.map((v) => () => processComparisonJob(v))
  ]
  await Promise.all(tasks.map(async (v) => await v()))
}
