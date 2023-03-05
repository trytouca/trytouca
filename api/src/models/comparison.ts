// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import type {
  BatchCompareOverview,
  TestcaseComparisonOverview
} from '@touca/api-schema'
import { floor } from 'lodash-es'
import mongoose from 'mongoose'

import { comparisonQueue, insertEvent } from '../queues/index.js'
import {
  ComparisonModel,
  IComparisonDocument,
  IMessageDocument,
  MessageModel
} from '../schemas/index.js'
import type {
  BackendBatchComparisonItemCommon,
  BackendBatchComparisonItemSolo,
  BackendBatchComparisonResponse
} from '../types/index.js'
import { logger, objectStore, redisClient } from '../utils/index.js'

type ObjectId = mongoose.Types.ObjectId

export type ComparisonJob = {
  jobId: ObjectId
  dstBatchId: ObjectId
  dstMessageId: ObjectId
  srcBatchId: ObjectId
  srcMessageId: ObjectId
}
export type MessageJob = {
  messageId: ObjectId
  batchId: ObjectId
}

export async function comparisonRemove(
  jobs: IComparisonDocument[]
): Promise<void> {
  try {
    // remove comparison processing jobs from the queue
    await Promise.allSettled(
      jobs.map((job) => comparisonQueue.queue.remove(job.id))
    )
    // remove JSON representation of comparison results from object storage
    await Promise.allSettled(
      jobs.map((job) => objectStore.removeComparison(job.contentId))
    )
    // remove documents from database
    await ComparisonModel.deleteMany({
      _id: { $in: jobs.map((elem) => elem._id) }
    })
    logger.silly('removed %d comparison jobs', jobs.length)
  } catch (err) {
    logger.warn('failed to remove comparison jobs: %s', err)
  }
}

export async function comparisonProcessEvent(comparison: IComparisonDocument) {
  const fields = await MessageModel.aggregate([
    { $match: { _id: comparison.srcMessageId } },
    {
      $lookup: {
        as: 'elementDoc',
        foreignField: '_id',
        from: 'elements',
        localField: 'elementId'
      }
    },
    { $unwind: '$elementDoc' },
    {
      $lookup: {
        as: 'batchDoc',
        foreignField: '_id',
        from: 'batches',
        localField: 'batchId'
      }
    },
    { $unwind: '$batchDoc' },
    {
      $lookup: {
        as: 'suiteDoc',
        foreignField: '_id',
        from: 'suites',
        localField: 'elementDoc.suiteId'
      }
    },
    { $unwind: '$suiteDoc' },
    {
      $lookup: {
        as: 'teamDoc',
        foreignField: '_id',
        from: 'teams',
        localField: 'suiteDoc.team'
      }
    },
    { $unwind: '$teamDoc' },
    {
      $project: {
        batchId: '$batchDoc._id',
        suiteId: '$suiteDoc._id',
        teamId: '$teamDoc._id',
        batchSlug: '$batchDoc.slug',
        suiteSlug: '$suiteDoc.slug',
        teamSlug: '$teamDoc.slug'
      }
    }
  ])
  if (!fields) {
    return
  }
  const f = fields[0]
  const slugs = [f.teamSlug, f.suiteSlug, f.batchSlug].join('_')
  redisClient.removeCachedByPrefix(`route_suiteList_${f.teamSlug}`)
  redisClient.removeCachedByPrefix(`route_batchCompare_${slugs}_`)
  await redisClient.removeCached(`route_batchLookup_${slugs}`)
  await insertEvent({
    type: 'message:compared',
    teamId: f.teamId,
    suiteId: f.suiteId,
    batchId: f.batchId
  })
  await insertEvent({
    type: 'batch:updated',
    teamId: f.teamId,
    suiteId: f.suiteId,
    batchId: f.batchId
  })
  await insertEvent({
    type: 'suite:updated',
    teamId: f.teamId,
    suiteId: f.suiteId,
    batchId: f.batchId
  })
}

export async function comparisonProcess(
  jobId,
  input
): Promise<{ status: number; error?: string }> {
  // we expect that comparison job exists
  const comparison = await ComparisonModel.findById(jobId)
  if (!comparison) {
    return { status: 404, error: 'comparison job not found' }
  }
  // we expect that comparison job is not already processed
  if (comparison.contentId) {
    return { status: 409, error: 'comparison job already processed' }
  }
  // insert comparison result in json format into object storage
  const doc = await objectStore.addComparison(
    comparison._id.toHexString(),
    JSON.stringify(input.body, null)
  )
  if (!doc) {
    return { status: 500, error: 'failed to handle comparison result' }
  }
  // mark comparison job as processed
  await ComparisonModel.findByIdAndUpdate(jobId, {
    $set: {
      processedAt: new Date(),
      contentId: comparison._id,
      meta: input.overview
    }
  })
  comparisonProcessEvent(comparison)
  return { status: 204 }
}

async function findComparisonResult(
  dstBatchId: ObjectId,
  dstMessageId: ObjectId,
  srcBatchId: ObjectId,
  srcMessageId: ObjectId
): Promise<IComparisonDocument> {
  // define what makes a comparison job be considered as processed

  const isProcessed = (obj: IComparisonDocument) => obj.contentId
  let doc = await ComparisonModel.findOne({ srcMessageId, dstMessageId })

  // we are done if comparison job is already processed

  if (doc && isProcessed(doc)) {
    return doc
  }

  // create comparison job if it did not exist

  if (!doc) {
    doc = new ComparisonModel({
      dstBatchId,
      dstMessageId,
      srcBatchId,
      srcMessageId
    })
    await doc.save()

    await comparisonQueue.queue.add(
      doc.id,
      {
        jobId: doc._id,
        dstBatchId,
        dstMessageId,
        srcBatchId,
        srcMessageId
      },
      {
        jobId: doc.id
      }
    )

    logger.silly('comparison result not available. created job.')
  }

  return doc
}

/**
 * updates result of comparison of a given element between two batches
 * with their matching score and other comparison result information.
 */
export async function compareCommonElement(
  dstBatchId: ObjectId,
  srcBatchId: ObjectId,
  item: BackendBatchComparisonItemCommon
): Promise<void> {
  // Find comparison result of the two messages associated with the
  // same element belonging to the two batches.
  //
  // This information is expected to be available in the document stored
  // in collection `comparisons` of the database. It is perfectly normal
  // that no such document exists which indicates that two messages are
  // not compared with each other. In this case, we need to create a
  // comparison job and wait for it to be processed.

  const doc = await findComparisonResult(
    dstBatchId,
    item.dst.messageId,
    srcBatchId,
    item.src.messageId
  )

  // for better user experience, report the score rounded down to four
  // digits after decimal. we choose four digits on Touca Server API to allow
  // clients report the score as 99.99% if they so choose. we are also
  // intentionally choosing to report 0.99999 as 0.9999 to distinguish
  // between perfect and partial matching scores.

  item.contentId = doc.contentId
  if (doc.meta) {
    item.meta = doc.meta
    item.meta.keysScore = floor(doc.meta.keysScore, 4)
  }
}

async function categorize(
  dstMessages: IMessageDocument[],
  srcMessages: IMessageDocument[]
): Promise<BackendBatchComparisonResponse> {
  const dstMap = new Map()
  const srcMap = new Map()
  dstMessages.map((msg: any) => dstMap.set(msg.elementId.name, msg))
  srcMessages.map((msg: any) => srcMap.set(msg.elementId.name, msg))

  const common: BackendBatchComparisonItemCommon[] = []
  const missing: BackendBatchComparisonItemSolo[] = []
  const fresh: BackendBatchComparisonItemSolo[] = []

  const convert = (msg, includeMeta = false) => {
    return {
      builtAt: msg.builtAt,
      contentId: msg.contentId,
      elementName: msg.elementId.name,
      messageId: msg._id,
      meta: includeMeta ? msg.meta : undefined
    }
  }

  for (const [k, v] of dstMap) {
    const sv = srcMap.get(k)
    if (!sv) {
      missing.push(convert(v, true))
      continue
    }
    common.push({
      dst: convert(v),
      src: convert(sv)
    })
  }
  for (const [k, v] of srcMap) {
    if (!dstMap.has(k)) {
      fresh.push(convert(v, true))
    }
  }

  return { common, fresh, missing }
}

function doFindBatchComparisonOverview(
  output: BackendBatchComparisonResponse,
  metaList: TestcaseComparisonOverview[]
): BatchCompareOverview {
  const elementsCompared = metaList
  const countDstCompared = output.missing.length + elementsCompared.length

  const getPerfectCount = (acc, v) =>
    v.keysScore === 1 && v.keysCountMissing === 0 ? acc + 1 : acc
  const getKeyScore = (v) =>
    (v.keysScore * v.keysCountCommon) / (v.keysCountCommon + v.keysCountMissing)
  const countPerfect = elementsCompared.reduce(getPerfectCount, 0)
  const score1 = countPerfect
  const score2 = elementsCompared.reduce((acc, v) => acc + getKeyScore(v), 0)
  const getScore = (score, count) => (count === 0 ? 1 : floor(score / count, 4))
  const getDuration = (dates: Date[]): number => {
    if (dates.length === 1) {
      return 0
    }
    const diff =
      +new Date(Math.max.apply(null, dates)) -
      +new Date(Math.min.apply(null, dates))
    return Math.round((diff * dates.length) / (dates.length - 1))
  }
  const srcDuration = getDuration([
    ...output.common.map((e) => e.src.builtAt as unknown as Date),
    ...output.fresh.map((e) => e.builtAt as unknown as Date)
  ])
  const dstDuration = getDuration([
    ...output.common.map((e) => e.dst.builtAt as unknown as Date),
    ...output.missing.map((e) => e.builtAt as unknown as Date)
  ])

  return {
    elementsCountDifferent: countDstCompared - countPerfect,
    elementsCountFresh: output.fresh.length,
    elementsCountHead: output.common.length + output.fresh.length,
    elementsCountMissing: output.missing.length,
    elementsCountPending: output.common.length - elementsCompared.length,
    elementsScoreAbsolute: getScore(score1, countDstCompared),
    elementsScoreAggregate: getScore(score2, countDstCompared),
    metricsDurationChange: Math.abs(srcDuration - dstDuration),
    metricsDurationHead: srcDuration,
    metricsDurationSign: Math.sign(srcDuration - dstDuration)
  }
}

export async function compareBatch(
  dstBatchId: ObjectId,
  srcBatchId: ObjectId
): Promise<BackendBatchComparisonResponse> {
  // find messages submitted for each batch

  const getBatchMessages = async (batchId: ObjectId) =>
    MessageModel.find(
      { batchId },
      { builtAt: 1, contentId: 1, elementId: 1, meta: 1 }
    ).populate({ path: 'elementId', select: 'name' })

  const dstMessages = (await getBatchMessages(dstBatchId)) as IMessageDocument[]
  const srcMessages = (await getBatchMessages(srcBatchId)) as IMessageDocument[]

  // categorize comparison results for elements

  const output = await categorize(dstMessages, srcMessages)

  // concurrently compare common elements between head and base batches

  await Promise.all(
    output.common.map((el) => compareCommonElement(dstBatchId, srcBatchId, el))
  )

  // add overview metadata to the comparison outputs

  const metaList = output.common.filter((cmp) => cmp.meta).map((el) => el.meta)
  output.overview = doFindBatchComparisonOverview(output, metaList)
  return output
}

export async function compareBatchOverview(
  dstBatchId: ObjectId,
  srcBatchId: ObjectId
): Promise<BatchCompareOverview> {
  // find messages submitted for each batch

  const getBatchMessages = async (batchId: ObjectId) =>
    MessageModel.find(
      { batchId },
      { builtAt: 1, contentId: 1, elementId: 1, meta: 1 }
    ).populate({ path: 'elementId', select: 'name' })

  const dstMessages = (await getBatchMessages(dstBatchId)) as IMessageDocument[]
  const srcMessages = (await getBatchMessages(srcBatchId)) as IMessageDocument[]

  // categorize comparison results for elements

  const output = await categorize(dstMessages, srcMessages)

  // find metadata of compared common elements

  const metaObjects = await ComparisonModel.aggregate([
    { $match: { dstBatchId, srcBatchId, meta: { $exists: true } } },
    { $project: { _id: 0, meta: 1 } }
  ])

  // @todo: combine this operation with aggregate operation above
  const metaList = metaObjects.map(
    (el) => el.meta
  ) as TestcaseComparisonOverview[]

  // add overview metadata to the comparison outputs
  return doFindBatchComparisonOverview(output, metaList)
}
