// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { BatchItem, Promotion } from '@touca/api-schema';

export type PromotionItem = Promotion & {
  bySelf: boolean;
};

export enum ELocalStorageKey {
  Callback = 'callback',
  LastVisitedTeam = 'lvt',
  TokenExpiresAt = 'expiresAt'
}

export type FrontendBatchItem = BatchItem & {
  isBaseline: boolean;
};

export type FrontendBatchCompareParams = {
  currentTab: string;
  teamSlug: string;
  srcSuiteSlug: string;
  srcBatchName: string;
  srcBatchSlug: string;
  dstSuiteSlug: string;
  dstBatchName: string;
  dstBatchSlug: string;
};

export type FrontendElementCompareParams = FrontendBatchCompareParams & {
  srcElementSlug: string;
  dstElementSlug: string;
};

export type FrontendOverviewSection = {
  inProgress: boolean;
  metricsDurationHead: number;
  metricsDurationChange: number;
  metricsDurationSign: number;
  resultsScore: number;
  statements: string[];
};

export type FrontendCommentItem = {
  commentAuthor: string;
  commentBody: string;
  commentEditTime: Date;
  commentId: string;
  commentTime: Date;
  replies: FrontendCommentItem[];
  showButtonReply: boolean;
  showButtonUpdate: boolean;
  showButtonRemove: boolean;
};

export enum FrontendCommentActionType {
  Post = 0,
  Remove,
  Reply,
  Update
}

export type FrontendCommentAction = {
  actionType: FrontendCommentActionType;
  commentId?: string;
};
