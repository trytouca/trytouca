/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

/**
 *
 */
export enum EPlatformRole {
  User = 'user',
  Admin = 'admin',
  Owner = 'owner',
  Super = 'super'
}

/**
 *
 */
export type Userinfo = {
  fullname: string;
  username: string;
};

/**
 *
 */
export type UserLookupResponse = {
  apiKeys: string[];
  email: string;
  fullname: string;
  platformRole: EPlatformRole;
  username: string;
};

/**
 *
 */
export type NotificationItem = {
  createdAt: Date;
  seenAt?: Date;
  text: string;
};

/**
 *
 */
export type NotificationListResponse = NotificationItem[];

/**
 *
 */
export enum ETeamRole {
  Invalid = 'unknown',
  Applicant = 'applicant',
  Invited = 'invited',
  Member = 'member',
  Admin = 'admin',
  Owner = 'owner'
}

/**
 *
 */
export type TeamItem = {
  role: ETeamRole;
  name: string;
  slug: string;
};

/**
 *
 */
export type TeamLookupResponse = TeamItem & {
  userCount: number;
};

/**
 *
 */
export type TeamListResponse = TeamItem[];

/**
 *
 */
export type TeamMember = {
  fullname: string;
  role: ETeamRole;
  username: string;
};

/**
 *
 */
export type TeamInvitee = {
  email: string;
  fullname: string;
  invitedAt: Date;
};

/**
 *
 */
export type TeamApplicant = {
  email: string;
  fullname: string;
  username: string;
};

/**
 *
 */
export type TeamMemberListResponse = {
  applicants: TeamApplicant[];
  invitees: TeamInvitee[];
  members: TeamMember[];
};

/**
 *
 */
export type Promotion = {
  at: Date;
  by: Userinfo;
  for: string;
  from: string;
  to: string;
};

/**
 *
 */
export type BatchCompareOverview = {
  elementsCountDifferent: number;
  elementsCountFresh: number;
  elementsCountHead: number;
  elementsCountMissing: number;
  elementsCountPending: number;
  elementsScoreAbsolute: number;
  elementsScoreAggregate: number;
  metricsDurationChange: number;
  metricsDurationHead: number;
  metricsDurationSign: number;
};

/**
 *
 */
export type BatchItemRaw = {
  batchSlug: string;
  comparedAgainst: string;
  expirable: boolean;
  isSealed: boolean;
  messageCount: number;
  submittedAt: Date;
  submittedBy: Userinfo[];
  updatedAt: Date;
};

/**
 *
 */
export type BatchItem = BatchItemRaw & {
  meta: BatchCompareOverview;
};

/**
 *
 */
export type BatchLookupResponse = BatchItem & {
  commentCount: number;
  suiteName: string;
  suiteSlug: string;
  teamName: string;
  teamSlug: string;
};

/**
 *
 */
export type BatchListResponse = BatchItem[];

/**
 *
 */
export type CommentItem = {
  at: Date;
  by: Userinfo;
  editedAt?: Date;
  id: string;
  replies: CommentItem[];
  text: string;
};

/**
 *
 */
export type CommentListResponse = CommentItem[];

/**
 *
 */
export type SuiteItem = {
  baseline?: BatchItemRaw;
  batchCount: number;
  latest?: BatchItemRaw;
  overview?: BatchCompareOverview;
  suiteName: string;
  suiteSlug: string;
};

/**
 *
 */
export type SuiteLookupResponse = SuiteItem & {
  batches: string[];
  isSubscribed: boolean;
  promotions: Promotion[];
  retainFor: number;
  sealAfter: number;
  subscriberCount: number;
  teamName: string;
  teamSlug: string;
};

/**
 *
 */
export type SuiteListResponse = SuiteItem[];

/**
 *
 */
export type CppTestcaseOverview = {
  keysCount: number;
  metricsCount: number;
  metricsDuration: number;
};

/**
 *
 */
export type CppTestcaseComparisonOverview = {
  keysCountCommon: number;
  keysCountFresh: number;
  keysCountMissing: number;
  keysScore: number;
  metricsCountCommon: number;
  metricsCountFresh: number;
  metricsCountMissing: number;
  metricsDurationCommonDst: number;
  metricsDurationCommonSrc: number;
};

/**
 *
 */
export type BatchComparisonItem = {
  builtAt: Date;
  elementName: string;
};

/**
 *
 */
export type BatchComparisonItemCommon = {
  dst: BatchComparisonItem;
  meta?: CppTestcaseComparisonOverview;
  src: BatchComparisonItem;
};

/**
 *
 */
export type BatchComparisonItemSolo = BatchComparisonItem & {
  meta?: CppTestcaseOverview;
};

/**
 *
 */
export type BatchComparisonResponse = {
  common: BatchComparisonItemCommon[];
  fresh: BatchComparisonItemSolo[];
  missing: BatchComparisonItemSolo[];
  overview?: BatchCompareOverview;
};

/**
 *
 */
type ElementListResponseItem = {
  metricsDuration: number;
  name: string;
};

/**
 *
 */
export type ElementListResponse = ElementListResponseItem[];

/**
 *
 */
export type ElementLookupResponse = {
  batches: {
    slug: string;
    submittedAt: Date;
    updatedAt: Date;
  }[];
  elementName: string;
  elementSlug: string;
  suiteName: string;
  suiteSlug: string;
  teamName: string;
  teamSlug: string;
};

/**
 *
 */
export type ElementComparisonItem = BatchComparisonItem & {
  submittedAt: Date;
  submittedBy: Userinfo;
};

/**
 *
 */
export type CppTypeComparison = {
  name: string;
  score?: number;
  srcType?: string;
  srcValue?: string;
  desc?: string[];
  dstType?: string;
  dstValue?: string;
};

/**
 *
 */
type CppCellar = {
  commonKeys: CppTypeComparison[];
  missingKeys: CppTypeComparison[];
  newKeys: CppTypeComparison[];
};

/**
 *
 */
type CppTestcaseMetadata = {
  builtAt: Date;
  teamslug: string;
  testcase: string;
  testsuite: string;
  version: string;
};

/**
 *
 */
type CppTestcaseComparison = {
  assertions: CppCellar;
  dst: CppTestcaseMetadata;
  metrics: CppCellar;
  results: CppCellar;
  src: CppTestcaseMetadata;
};

/**
 *
 */
export type ElementComparisonResponse = {
  cmp?: CppTestcaseComparison;
  dst: ElementComparisonItem;
  meta?: CppTestcaseComparisonOverview;
  src: ElementComparisonItem;
};

/**
 *
 */
export type PlatformStatsUser = {
  activationLink?: string;
  createdAt: Date;
  fullname?: string;
  email: string;
  resetKeyLink?: string;
  resetKeyCreatedAt?: Date;
  resetKeyExpiresAt?: Date;
  role: EPlatformRole;
  username: string;
};

/**
 *
 */
export type PlatformStatsResponse = {
  batches: number;
  cmpPending: number;
  cmpProcessed: number;
  msgPending: number;
  msgProcessed: number;
  spaceFree: number;
  spaceSize: number;
  spaceUsed: number;
  suites: number;
  teams: number;
  users: PlatformStatsUser[];
};
