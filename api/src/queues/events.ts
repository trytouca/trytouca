// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ServerEventJob } from '@touca/api-schema'

import { broadcastEvent } from '@/utils/events'
import { createQueue, createWorker, PerformanceMarks } from '@/utils/queue'

async function processor(job: ServerEventJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  broadcastEvent(job)
  return Promise.resolve(perf)
}

export async function insertJob(job: ServerEventJob) {
  queue.add(job.type, job)
}

export const queue = createQueue('events')
export const worker = createWorker('events', processor)
