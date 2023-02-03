// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { MessageJob, messageProcess } from '../models/index.js'
import { objectStore } from '../utils/index.js'
import { JobQueue, PerformanceMarks } from './common.js'

async function processor(job: MessageJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  const buffer = await objectStore.getMessage(job.messageId.toString())
  perf.mark('object_store:fetch')
  await messageProcess(job.messageId, buffer)
  perf.mark('message:process')
  return perf
}

export const messageQueue = new JobQueue('messages', processor)
