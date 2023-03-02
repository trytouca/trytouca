// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type {
  BatchCompareOverview,
  BatchComparisonItem,
  BatchItem,
  TestcaseComparisonOverview,
  TestcaseOverview
} from '@touca/api-schema'
import { Types } from 'mongoose'

export type BatchItemQueryOutput = Exclude<BatchItem, 'submittedBy'> & {
  _id: Types.ObjectId
  submittedBy: Types.ObjectId[]
  superior: Types.ObjectId
}

export type BackendBatchComparisonItem = BatchComparisonItem & {
  contentId: string
  messageId: Types.ObjectId
}

export type BackendBatchComparisonItemCommon = {
  dst: BackendBatchComparisonItem
  meta?: TestcaseComparisonOverview
  src: BackendBatchComparisonItem

  cmp?: unknown
  contentId?: string
}

export type BackendBatchComparisonItemSolo = BackendBatchComparisonItem & {
  meta?: TestcaseOverview
}

export type BackendBatchComparisonResponse = {
  common: BackendBatchComparisonItemCommon[]
  fresh: BackendBatchComparisonItemSolo[]
  missing: BackendBatchComparisonItemSolo[]
  overview?: BatchCompareOverview
}

export type CommentType = 'batch' | 'element' | 'suite' | 'team'

export type Artifact = {
  filename_external: string
  filename_internal: string
  message_id: string
  mime?: string
  content: Buffer
}
