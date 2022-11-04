// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  createQueue,
  createQueueScheduler,
  createWorker,
  PerformanceMarks
} from '@/utils/queue'
import { BatchItem } from '@touca/api-schema'
import BatchServerEvents from '@/utils/batchServerEvents'
import { BatchModel } from '@/schemas/batch'
import { ComparisonFunctions } from '@/controllers/comparison'

export enum OpType {
  InsertOne = 'insertOne',
  UpdateOne = 'updateOne',
  DeleteOne = 'deleteOne'
}

export enum ToucaEntity {
  Batch = 'batch'
}

interface ServerEventJob {
  affectedEntity: ToucaEntity
  operation: OpType
}

interface InsertOneBatchJob extends ServerEventJob {
  affectedEntity: ToucaEntity.Batch
  operation: OpType.InsertOne
  teamSlug: string
  suiteSlug: string
  batchId: string
}

const isInsertOneBatchJob = (ev: ServerEventJob): ev is InsertOneBatchJob =>
  ev.affectedEntity === ToucaEntity.Batch && ev.operation === OpType.InsertOne

const getBatchItem = async (batchId: string): Promise<BatchItem> => {
  const batchItems = await BatchModel.aggregate([
    { $match: { _id: batchId } },
    {
      $lookup: {
        from: 'users',
        localField: 'submittedBy',
        foreignField: '_id',
        as: 'submittedByDoc'
      }
    },
    { $unwind: '$submittedByDoc' },
    {
      $lookup: {
        from: 'batches',
        localField: 'superior',
        foreignField: '_id',
        as: 'superiorDoc'
      }
    },
    { $unwind: '$superiorDoc' },
    {
      $project: {
        _id: 1,
        batchSlug: '$slug',
        comparedAgainst: '$superiorDoc.slug',
        expirable: 1,
        isSealed: { $cond: [{ $ifNull: ['$sealedAt', false] }, true, false] },
        messageCount: { $size: '$elements' },
        meta: 1,
        submittedAt: 1,
        submittedBy: {
          username: '$submittedByDoc.username',
          fullname: '$submittedByDoc.fullname'
        },
        superior: 1,
        updatedAt: 1
      }
    }
  ])

  const item = batchItems[0]

  item.meta = await ComparisonFunctions.compareBatchOverview(
    item.superior,
    item._id
  )
  delete item._id
  delete item.superior

  return item
}

const routeJob = async (job: ServerEventJob) => {
  if (isInsertOneBatchJob(job)) {
    const { teamSlug, suiteSlug, batchId } = job

    const batchItem = await getBatchItem(batchId)

    BatchServerEvents.insertOneBatch({
      teamSlug,
      suiteSlug,
      batchItem
    })
  }
}

// @todo: fix performance mark tags
async function processor(job: ServerEventJob) {
  const perf = new PerformanceMarks()
  await routeJob(job)
  perf.mark('server_event_queue:emit_event')
  return Promise.resolve(perf)
}

const queue = createQueue('serverEvents')
createWorker('serverEvents', processor)
createQueueScheduler('serverEvents')

export const insertOneBatch = (
  teamSlug: string,
  suiteSlug: string,
  batchId: string
) => {
  const entity = ToucaEntity.Batch
  const op = OpType.InsertOne

  const job: InsertOneBatchJob = {
    teamSlug,
    suiteSlug,
    affectedEntity: entity,
    operation: op,
    batchId
  }

  queue.add(`${entity}_${op}`, job)
}
