// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  createQueue,
  createQueueScheduler,
  createWorker,
  PerformanceMarks
} from '@/utils/queue'
import { BatchItem } from '@touca/api-schema'
import BatchServerEvents from '@/utils/batchServerEvents'

export enum OpType {
  InsertOne = 'insertOne',
  UpdateOne = 'updateOne',
  DeleteOne = 'deleteOne'
}

export enum ToucaEntity {
  Batch = 'batch'
}

interface ServerEventJob<T = unknown> {
  affectedEntity: ToucaEntity
  operation: OpType
  document: T
}

interface InsertOneBatchJob extends ServerEventJob<BatchItem> {
  affectedEntity: ToucaEntity.Batch
  operation: OpType.InsertOne
  teamSlug: string
  suiteSlug: string
}

const isInsertOneBatchJob = (ev: ServerEventJob): ev is InsertOneBatchJob =>
  ev.affectedEntity === ToucaEntity.Batch && ev.operation === OpType.InsertOne

const routeJob = (job: ServerEventJob) => {
  if (isInsertOneBatchJob(job)) {
    const { teamSlug, suiteSlug } = job
    BatchServerEvents.insertOneBatch({
      teamSlug,
      suiteSlug,
      batchItem: job.document
    })
  }
}

// @todo: fix performance mark tags
function processor(job: ServerEventJob) {
  const perf = new PerformanceMarks()
  routeJob(job)
  perf.mark('server_event_queue:emit_event')
  return Promise.resolve(perf)
}

const queue = createQueue('serverEvents')
createWorker('serverEvents', processor)
createQueueScheduler('serverEvents')

export const insertOneBatch = (
  teamSlug: string,
  suiteSlug: string,
  batchItem: BatchItem
) => {
  const entity = ToucaEntity.Batch
  const op = OpType.InsertOne

  const job: InsertOneBatchJob = {
    teamSlug,
    suiteSlug,
    affectedEntity: entity,
    operation: op,
    document: batchItem
  }

  queue.add(`${entity}_${op}`, job)
}
