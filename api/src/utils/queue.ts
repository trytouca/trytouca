// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Queue, Worker } from 'bullmq'
import { hrtime } from 'process'

import { getRedisConnectionOptions } from './config'
import logger from './logger'

export class PerformanceMarks {
  private marks: Record<string, number> = {}
  private tic = hrtime()

  get totalRuntime(): number {
    return this.marks['job:runtime']
  }

  stop() {
    this.mark('job:runtime')
  }

  mark(name: string) {
    this.marks[name] = hrtime(this.tic).reduce(
      (sec, nano) => sec * 1e3 + nano * 1e-6
    )
  }
}

export function createQueue(name: string) {
  return new Queue(name, {
    connection: getRedisConnectionOptions(),
    defaultJobOptions: { removeOnComplete: true, removeOnFail: 1000 }
  })
}

export function createWorker<D, R extends PerformanceMarks, N extends string>(
  name: N,
  processor: (data: D) => Promise<R>
) {
  return new Worker<D, R, N>(
    name,
    async (job) => {
      const marks = await processor(job.data)
      marks.stop()
      return marks
    },
    {
      autorun: false,
      connection: getRedisConnectionOptions(),
      concurrency: 4
    }
  )
    .on('active', (job) => {
      logger.debug('%s:%s: processing', name[0], job.name)
    })
    .on('failed', (job) => {
      const err = job.failedReason
      logger.error('%s:%s: failed to process job: %s', name[0], job.name, err)
    })
    .on('completed', (job) => {
      const ms = job.returnvalue.totalRuntime.toFixed(0)
      logger.info('%s:%s: processed (%s ms)', name[0], job.name, ms)
    })
}
