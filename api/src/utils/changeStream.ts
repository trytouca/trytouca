import { BatchInsertEvent, BatchEventType } from '@touca/server-events'
import { BatchItem } from '@touca/api-schema'
import { IBatchDocument, BatchModel } from '@/schemas/batch'
import mongoose from 'mongoose'
import ServerEvents from './serverEvents'
import logger from '@/utils/logger'
import { ComparisonFunctions } from '@/controllers/comparison'

type OpType =
  | 'insert'
  | 'delete'
  | 'drop'
  | 'dropDatabase'
  | 'invalidate'
  | 'rename'
  | 'replace'
  | 'update'

type Collection = 'batches' | 'comparisons' | 'messages'

// workaround for inaccessibility of mongo driver types through Mongoose.
// https://github.com/Automattic/mongoose/pull/11954 should fix this issue
// if it ever gets merged.
interface DocStub<T = unknown> {
  operationType: OpType
  ns?: {
    coll: Collection
  }
  fullDocument?: T
}

const isBatchInsertStreamEvent = (
  doc: DocStub
): doc is DocStub<IBatchDocument> =>
  doc.operationType === 'insert' && doc.ns?.coll === 'batches'

const getBatchItem = async (
  doc: DocStub<IBatchDocument>
): Promise<BatchItem> => {
  const batchId = doc.fullDocument._id

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

const formatBatchInsertEvent = (batchItem: BatchItem): BatchInsertEvent => ({
  eventType: BatchEventType.BatchInsert,
  record: batchItem
})

const routeChangeStreamEvent = (doc: DocStub) => {
  if (isBatchInsertStreamEvent(doc)) {
    logger.debug('BROADCASTING BATCH INSERT')
    return getBatchItem(doc)
      .then(formatBatchInsertEvent)
      .then(ServerEvents.broadcast)
  }

  logger.error(
    'uncaught change stream event: %s, %s',
    doc.operationType,
    doc.ns?.coll
  )
}

let calls = 0

export const initChangeStream = () => {
  if (calls > 0) return

  calls++

  const client = mongoose.connection.getClient()

  const db = client.db('touca')

  const stream = db.watch([], { fullDocument: 'updateLookup' })

  stream.on('change', routeChangeStreamEvent)
}
