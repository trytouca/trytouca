// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Queue, Worker } from 'bullmq'
import { hrtime } from 'process'

import { createRedisConnection } from '@/utils/redis'

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

function createQueue(name: string) {
  return new Queue(name, {
    connection: createRedisConnection(),
    defaultJobOptions: { removeOnComplete: true, removeOnFail: 1000 }
  })
}

function createWorker<D, R extends PerformanceMarks, N extends string>(
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
      connection: createRedisConnection(),
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

export class JobQueue<D, R extends PerformanceMarks, N extends string> {
  _queue: Queue
  _worker: Worker

  constructor(private name: N, private processor: (data: D) => Promise<R>) {}

  get add() {
    return this._queue.add
  }
  get addBulk() {
    return this._queue.addBulk
  }
  get remove() {
    return this._queue.remove
  }

  start() {
    this._queue = createQueue(this.name)
    this._worker = createWorker(this.name, this.processor)
    this._worker.run()
  }

  async close() {
    await this._worker?.close()
    await this._queue?.close()
  }
}
