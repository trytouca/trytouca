// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ServerEventJob } from '@touca/api-schema'

import { broadcastEvent, JobQueue, PerformanceMarks } from '../utils/index.js'

async function processor(job: ServerEventJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  broadcastEvent(job)
  return Promise.resolve(perf)
}

export async function insertEvent(job: ServerEventJob) {
  eventsQueue.queue.add(job.type, job)
}

export const eventsQueue = new JobQueue('events', processor)
