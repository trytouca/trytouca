/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import type { Types } from 'mongoose'

import type {
  BatchItem,
  BatchComparisonItem,
  BatchCompareOverview,
  CppTestcaseComparisonOverview,
  CppTestcaseOverview,
  SuiteItem,
  Userinfo
} from './commontypes'

/**
 *
 */
export type PromotionQueryOutput = {
  at: Date
  by: Types.ObjectId
  for: string
  from: Types.ObjectId
  to: Types.ObjectId
}

/**
 *
 */
export type BatchItemQueryOutput = Exclude<BatchItem, 'submittedBy'> & {
  _id: Types.ObjectId
  submittedBy: Types.ObjectId[]
  superior: Types.ObjectId
}

/**
 *
 */
export type SuiteItemQueryOutput = Exclude<SuiteItem, 'baseline' | 'latest'> & {
  baseline: BatchItemQueryOutput
  latest: BatchItemQueryOutput
}

/**
 *
 */
export type BackendBatchComparisonItem = BatchComparisonItem & {
  elasticId: string
  messageId: Types.ObjectId
}

/**
 *
 */
export type BackendBatchComparisonItemCommon = {
  dst: BackendBatchComparisonItem
  meta?: CppTestcaseComparisonOverview
  src: BackendBatchComparisonItem

  cmp?: unknown
  elasticId?: string
}

/**
 *
 */
export type BackendBatchComparisonItemSolo = BackendBatchComparisonItem & {
  meta?: CppTestcaseOverview
}

/**
 *
 */
export type BackendBatchComparisonResponse = {
  common: BackendBatchComparisonItemCommon[]
  fresh: BackendBatchComparisonItemSolo[]
  missing: BackendBatchComparisonItemSolo[]
  overview?: BatchCompareOverview
}

/**
 *
 */
export enum ECommentType {
  Batch = 'batch',
  Element = 'element',
  Suite = 'suite',
  Team = 'team'
}

/**
 *
 */
export type CommentListQueryOutput = {
  _id: Types.ObjectId
  at: Date
  by: Userinfo
  editedAt: Date
  parentId: Types.ObjectId
  text: string
}
