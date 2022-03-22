// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export enum EFeatureFlag {
  NewsletterProduct = 'newsletter_product',
  NewsletterChangelog = 'newsletter_changelog'
}

export enum EPlatformRole {
  User = 'user',
  Admin = 'admin',
  Owner = 'owner',
  Super = 'super'
}

export enum ENotificationType {
  None = 'none',
  Different = 'different',
  All = 'all'
}

export type Userinfo = {
  fullname: string;
  username: string;
};

export type UserLookupResponse = {
  apiKeys: string[];
  email: string;
  feature_flags: string[];
  fullname: string;
  platformRole: EPlatformRole;
  user_hash: string;
  user_id: string;
  username: string;
};

export type NotificationItem = {
  createdAt: Date;
  seenAt?: Date;
  text: string;
};

export type NotificationListResponse = NotificationItem[];

export enum ETeamRole {
  Invalid = 'unknown',
  Applicant = 'applicant',
  Invited = 'invited',
  Member = 'member',
  Admin = 'admin',
  Owner = 'owner'
}

export type TeamItem = {
  role: ETeamRole;
  name: string;
  slug: string;
};

export type TeamLookupResponse = TeamItem & {
  userCount: number;
};

export type TeamListResponse = TeamItem[];

export type TeamMember = {
  fullname: string;
  role: ETeamRole;
  username: string;
};

export type TeamInvitee = {
  email: string;
  fullname: string;
  invitedAt: Date;
};

export type TeamApplicant = {
  email: string;
  fullname: string;
  username: string;
};

export type TeamMemberListResponse = {
  applicants: TeamApplicant[];
  invitees: TeamInvitee[];
  members: TeamMember[];
};

export type Promotion = {
  at: Date;
  by: Userinfo;
  for: string;
  from: string;
  to: string;
};

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

export type BatchItem = BatchItemRaw & {
  meta: BatchCompareOverview;
};

export type BatchLookupResponse = BatchItem & {
  commentCount: number;
  suiteName: string;
  suiteSlug: string;
  teamName: string;
  teamSlug: string;
};

export type BatchListResponse = BatchItem[];

export type CommentItem = {
  at: Date;
  by: Userinfo;
  editedAt?: Date;
  id: string;
  replies: CommentItem[];
  text: string;
};

export type CommentListResponse = CommentItem[];

export type SuiteItem = {
  baseline?: BatchItemRaw;
  batchCount: number;
  latest?: BatchItemRaw;
  overview?: BatchCompareOverview;
  suiteName: string;
  suiteSlug: string;
};

export type SuiteLookupResponse = SuiteItem & {
  batches: string[];
  /** @deprecated (remove in 22/03) */
  isSubscribed?: boolean;
  promotions: Promotion[];
  retainFor: number;
  sealAfter: number;
  /** @deprecated (remove in 22/03) */
  subscriberCount?: number;
  subscription: ENotificationType;
  teamName: string;
  teamSlug: string;
};

export type SuiteListResponse = SuiteItem[];

export type CppTestcaseOverview = {
  keysCount: number;
  metricsCount: number;
  metricsDuration: number;
};

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

export type BatchComparisonItem = {
  builtAt: Date;
  elementName: string;
};

export type BatchComparisonItemCommon = {
  dst: BatchComparisonItem;
  meta?: CppTestcaseComparisonOverview;
  src: BatchComparisonItem;
};

export type BatchComparisonItemSolo = BatchComparisonItem & {
  meta?: CppTestcaseOverview;
};

export type BatchComparisonResponse = {
  common: BatchComparisonItemCommon[];
  fresh: BatchComparisonItemSolo[];
  missing: BatchComparisonItemSolo[];
  overview?: BatchCompareOverview;
};

export type ElementListResponseItem = {
  metricsDuration: number;
  name: string;
  note: string;
  slug: string;
  tags: string[];
  versions: {
    name: string;
    match: number;
    time: number;
  }[];
};

export type ElementListResponse = ElementListResponseItem[];

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

export type ElementComparisonItem = BatchComparisonItem & {
  submittedAt: Date;
  submittedBy: Userinfo;
};

export type CppTypeComparison = {
  name: string;
  score?: number;
  srcType?: string;
  srcValue?: string;
  desc?: string[];
  dstType?: string;
  dstValue?: string;
};

type CppCellar = {
  commonKeys: CppTypeComparison[];
  missingKeys: CppTypeComparison[];
  newKeys: CppTypeComparison[];
};

type CppTestcaseMetadata = {
  builtAt: Date;
  teamslug: string;
  testcase: string;
  testsuite: string;
  version: string;
};

type CppTestcaseComparison = {
  assertions: CppCellar;
  dst: CppTestcaseMetadata;
  metrics: CppCellar;
  results: CppCellar;
  src: CppTestcaseMetadata;
};

export type ElementComparisonResponse = {
  cmp?: CppTestcaseComparison;
  dst: ElementComparisonItem;
  meta?: CppTestcaseComparisonOverview;
  src: ElementComparisonItem;
};

export type PlatformStatus = {
  mail: boolean;
  ready: boolean;
  self_hosted: boolean;
};

export type PlatformStatsUser = {
  activationLink?: string;
  createdAt: Date;
  email: string;
  fullname?: string;
  lockedAt?: Date;
  resetKeyLink?: string;
  resetKeyCreatedAt?: Date;
  resetKeyExpiresAt?: Date;
  role: EPlatformRole;
  suspended?: boolean;
  username: string;
};

export type PlatformStatsResponse = {
  cmpAvgCollectionTime: number;
  cmpAvgProcessingTime: number;
  countBatches: number;
  countComparisons: number;
  countElements: number;
  countMessages: number;
  spaceFree: number;
  spaceSize: number;
  spaceUsed: number;
  users: PlatformStatsUser[];
};
