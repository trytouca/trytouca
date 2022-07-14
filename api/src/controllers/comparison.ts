// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type {
  BatchCompareOverview,
  CppTestcaseComparisonOverview
} from '@touca/api-schema'
import { floor } from 'lodash'
import mongoose from 'mongoose'

import { ComparisonModel, IComparisonDocument } from '@/schemas/comparison'
import { IMessageDocument, MessageModel } from '@/schemas/message'
import type {
  BackendBatchComparisonItemCommon,
  BackendBatchComparisonItemSolo,
  BackendBatchComparisonResponse
} from '@/types/backendtypes'
import logger from '@/utils/logger'

type ObjectId = mongoose.Types.ObjectId

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
    logger.silly('comparison result not available. created job.')
  }

  return doc
}

/**
 * updates result of comparison of a given element between two batches
 * with their matching score and other comparison result information.
 */
async function compareCommonElement(
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
  metaList: CppTestcaseComparisonOverview[]
): BatchCompareOverview {
  const elementsCompared = metaList
  const countDstCompared = output.missing.length + elementsCompared.length

  const getPerfectCount = (acc, v) => (v.keysScore === 1 ? acc + 1 : acc)
  const countPerfect = elementsCompared.reduce(getPerfectCount, 0)
  const score1 = countPerfect
  const score2 = elementsCompared.reduce((acc, v) => acc + v.keysScore, 0)
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
    ...output.common.map((e) => e.src.builtAt),
    ...output.fresh.map((e) => e.builtAt)
  ])
  const dstDuration = getDuration([
    ...output.common.map((e) => e.dst.builtAt),
    ...output.missing.map((e) => e.builtAt)
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

async function compareBatch(
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

async function compareBatchOverview(
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
  ) as CppTestcaseComparisonOverview[]

  // add overview metadata to the comparison outputs

  return doFindBatchComparisonOverview(output, metaList)
}

export const ComparisonFunctions = {
  compareBatch,
  compareBatchOverview,
  compareCommonElement
}
