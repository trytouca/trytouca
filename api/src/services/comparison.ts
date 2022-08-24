// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  ComparisonJob,
  comparisonProcess,
  getComparisonJobs,
  MessageJob
} from '@/models/comparison'
import { messageProcess, MessageProcessInput } from '@/models/message'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

async function parseMessage(message): Promise<MessageProcessInput> {
  return {
    overview: {
      keysCount: 0,
      metricsCount: 0,
      metricsDuration: 0
    },
    body: {}
  }
}

async function parseComparison(src: Buffer, dst: Buffer) {
  return {
    overview: {
      keysCountCommon: 0,
      keysCountFresh: 0,
      keysCountMissing: 0,
      metricsCountCommon: 0,
      metricsCountFresh: 0,
      metricsCountMissing: 0,
      metricsDurationCommonDst: 0,
      metricsDurationCommonSrc: 0
    },
    body: {
      src: {
        teamslug: 'teamslug',
        testsuite: 'testsuite',
        version: 'version',
        testcase: 'testcase',
        builtAt: 'builtAt'
      },
      dst: {
        teamslug: 'teamslug',
        testsuite: 'testsuite',
        version: 'version',
        testcase: 'testcase',
        builtAt: 'builtAt'
      },
      assertions: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      },
      results: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      },
      metrics: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      }
    }
  }
}

async function processMessageJob(job: MessageJob) {
  logger.debug('m:%s: processing', job.messageId)
  const tic = Date.now()
  const message = await objectStore.getMessage(job.messageId.toString())
  const output = await parseMessage(message)
  await messageProcess(job.messageId.toString(), output)
  logger.info('m:%s: processed (%d ms)', job.messageId, Date.now() - tic)
}

async function processComparisonJob(job: ComparisonJob) {
  logger.debug('c:%s: processing', job.jobId)
  const tic = Date.now()
  const dst = await objectStore.getMessage(job.dstMessageId.toString())
  const src = await objectStore.getMessage(job.srcMessageId.toString())
  const output = await parseComparison(src, dst)
  await comparisonProcess(job.jobId.toString(), output)
  logger.info('c:%s: processed (%d ms)', job.jobId, Date.now() - tic)
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
