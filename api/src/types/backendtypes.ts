// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { Types } from 'mongoose'

import type {
  BatchCompareOverview,
  BatchComparisonItem,
  BatchItem,
  CppTestcaseComparisonOverview,
  CppTestcaseOverview,
  ENotificationType,
  SuiteItem,
  Userinfo
} from '@touca/api-types'

export type PromotionQueryOutput = {
  at: Date
  by: Types.ObjectId
  for: string
  from: Types.ObjectId
  to: Types.ObjectId
}

export type SubscriptionQueryOutput = {
  user: Types.ObjectId
  level: ENotificationType
}

export type BatchItemQueryOutput = Exclude<BatchItem, 'submittedBy'> & {
  _id: Types.ObjectId
  submittedBy: Types.ObjectId[]
  superior: Types.ObjectId
}

export type SuiteItemQueryOutput = Exclude<SuiteItem, 'baseline' | 'latest'> & {
  baseline: BatchItemQueryOutput
  latest: BatchItemQueryOutput
}

export type BackendBatchComparisonItem = BatchComparisonItem & {
  contentId: string
  messageId: Types.ObjectId
}

export type BackendBatchComparisonItemCommon = {
  dst: BackendBatchComparisonItem
  meta?: CppTestcaseComparisonOverview
  src: BackendBatchComparisonItem

  cmp?: unknown
  contentId?: string
}

export type BackendBatchComparisonItemSolo = BackendBatchComparisonItem & {
  meta?: CppTestcaseOverview
}

export type BackendBatchComparisonResponse = {
  common: BackendBatchComparisonItemCommon[]
  fresh: BackendBatchComparisonItemSolo[]
  missing: BackendBatchComparisonItemSolo[]
  overview?: BatchCompareOverview
}

export enum ECommentType {
  Batch = 'batch',
  Element = 'element',
  Suite = 'suite',
  Team = 'team'
}

export type CommentListQueryOutput = {
  _id: Types.ObjectId
  at: Date
  by: Userinfo
  editedAt: Date
  parentId: Types.ObjectId
  text: string
}
