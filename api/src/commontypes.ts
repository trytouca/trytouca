/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

/**
 * @schema CT_EPlatformRole
 *  type: string
 *  enum: ['user', 'admin', 'owner']
 */
export enum EPlatformRole {
  User = 'user',
  Admin = 'admin',
  Owner = 'owner',
  Super = 'super'
}

/**
 * @schema CT_Userinfo
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - fullname
 *    - username
 *  properties:
 *    fullname:
 *      type: string
 *    username:
 *      type: string
 */
export type Userinfo = {
  fullname: string
  username: string
}

/**
 * @schema CT_UserLookupResponse
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - apiKeys
 *    - email
 *    - fullname
 *    - isVerified
 *    - platformRole
 *    - username
 *  properties:
 *    apiKeys:
 *      type: array
 *      items:
 *        type: string
 *        format: uuid
 *    email:
 *      type: string
 *      format: email
 *    fullname:
 *      type: string
 *    isVerified:
 *      type: boolean
 *    platformRole:
 *      $ref: '#/components/schemas/CT_EPlatformRole'
 *    username:
 *      type: string
 */
export type UserLookupResponse = {
  apiKeys: string[]
  email: string
  fullname: string
  isVerified: boolean
  platformRole: EPlatformRole
  username: string
}

/**
 * @schema CT_NotificationItem
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - createdAt
 *    - text
 *  properties:
 *    createdAt:
 *      type: Date
 *    seenAt:
 *      type: Date
 *    text:
 *      type: string
 */
export type NotificationItem = {
  createdAt: Date
  seenAt?: Date
  text: string
}

/**
 * @schema CT_NotificationListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_NotificationItem'
 */
export type NotificationListResponse = NotificationItem[]

/**
 * @schema CT_ETeamRole
 *  type: string
 *  enum: ['applicant', 'invited', 'member', 'admin', 'owner']
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
 * @schema CT_TeamItem
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - name
 *    - role
 *    - slug
 *  properties:
 *    name:
 *      type: string
 *    role:
 *      $ref: '#/components/schemas/CT_ETeamRole'
 *    slug:
 *      type: string
 */
export type TeamItem = {
  role: ETeamRole
  name: string
  slug: string
}

/**
 * @schema CT_TeamLookupResponse
 *  allOf:
 *    - $ref: '#/components/schemas/CT_TeamItem'
 *    - type: object
 *      additionalProperties: false
 *      required:
 *        - userCount
 *      properties:
 *        userCount:
 *          type: number
 */
export type TeamLookupResponse = TeamItem & {
  userCount: number
}

/**
 * @schema CT_TeamListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_TeamItem'
 */
export type TeamListResponse = TeamItem[]

/**
 * @schema CT_TeamMember
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - username
 *    - fullname
 *    - role
 *  properties:
 *    username:
 *      type: string
 *    fullname:
 *      type: string
 *    role:
 *      $ref: '#/components/schemas/CT_ETeamRole'
 */
type TeamMember = {
  fullname: string
  role: ETeamRole
  username: string
}

/**
 * @schema CT_TeamInvitee
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - email
 *    - invitedAt
 *  properties:
 *    email:
 *      type: string
 *      format: email
 *    fullname:
 *      type: string
 *    invitedAt:
 *      type: string
 *      format: date-time
 */
type TeamInvitee = {
  email: string
  fullname: string
  invitedAt: Date
}

/**
 * @schema CT_TeamApplicant
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - email
 *    - fullname
 *    - username
 *  properties:
 *    email:
 *      type: string
 *      format: email
 *    fullname:
 *      type: string
 *    username:
 *      type: string
 */
type TeamApplicant = {
  email: string
  fullname: string
  username: string
}

/**
 * @schema CT_TeamMemberListResponse
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - invitees
 *    - members
 *  properties:
 *    applicants:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_TeamApplicant'
 *    invitees:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_TeamInvitee'
 *    members:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_TeamMember'
 */
export type TeamMemberListResponse = {
  applicants: TeamApplicant[]
  invitees: TeamInvitee[]
  members: TeamMember[]
}

/**
 * @schema CT_Promotion
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - at
 *    - by
 *    - for
 *    - from
 *    - to
 *  properties:
 *    at:
 *      type: string
 *      format: date-time
 *    by:
 *      $ref: '#/components/schemas/CT_Userinfo'
 *    for:
 *      type: string
 *    from:
 *      type: string
 *    to:
 *      type: string
 */
export type Promotion = {
  at: Date
  by: Userinfo
  for: string
  from: string
  to: string
}

/**
 * @schema CT_BatchCompareOverview
 *  type: object
 *  properties:
 *    elementsCountDifferent:
 *      type: integer
 *      format: int32
 *    elementsCountFresh:
 *      type: integer
 *      format: int32
 *    elementsCountHead:
 *      type: integer
 *      format: int32
 *    elementsCountMissing:
 *      type: integer
 *      format: int32
 *    elementsCountPending:
 *      type: integer
 *      format: int32
 *    elementsScoreAbsolute:
 *      type: number
 *      format: float
 *    elementsScoreAggregate:
 *      type: number
 *      format: float
 *    metricsDurationChange:
 *      type: integer
 *      format: int32
 *    metricsDurationHead:
 *      type: integer
 *      format: int32
 *    metricsDurationSign:
 *      type: integer
 *      format: int32
 */
export type BatchCompareOverview = {
  elementsCountDifferent: number
  elementsCountFresh: number
  elementsCountHead: number
  elementsCountMissing: number
  elementsCountPending: number
  elementsScoreAbsolute: number
  elementsScoreAggregate: number
  metricsDurationChange: number
  metricsDurationHead: number
  metricsDurationSign: number
}

/**
 * @schema CT_BatchItemRaw
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - batchSlug
 *    - comparedAgainst
 *    - expirable
 *    - isSealed
 *    - messageCount
 *    - submittedAt
 *    - submittedBy
 *    - updatedAt
 *  properties:
 *    batchSlug:
 *      type: string
 *    comparedAgainst:
 *      type: string
 *    expirable:
 *      type: boolean
 *    isSealed:
 *      type: boolean
 *    messageCount:
 *      type: number
 *    submittedAt:
 *      type: string
 *      format: date-time
 *    submittedBy:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_Userinfo'
 *    updatedAt:
 *      type: string
 *      format: date-time
 */
export type BatchItemRaw = {
  batchSlug: string
  comparedAgainst: string
  expirable: boolean
  isSealed: boolean
  messageCount: number
  submittedAt: Date
  submittedBy: Userinfo[]
  updatedAt: Date
}

/**
 * @schema CT_BatchItem
 *  allOf:
 *    - $ref: '#/components/schemas/CT_BatchItemRaw'
 *    - type: object
 *      required:
 *        - meta
 *      properties:
 *        meta:
 *          $ref: '#/components/schemas/CT_BatchCompareOverview'
 */
export type BatchItem = BatchItemRaw & {
  meta: BatchCompareOverview
}

/**
 * @schema CT_BatchLookupResponse
 *  allOf:
 *    - $ref: '#/components/schemas/CT_BatchItem'
 *    - type: object
 *      additionalProperties: false
 *      required:
 *        - commentCount
 *        - meta
 *        - suiteName
 *        - suiteSlug
 *        - teamName
 *        - teamSlug
 *      properties:
 *        commentCount:
 *          type: number
 *        suiteName:
 *          type: string
 *        suiteSlug:
 *          type: string
 *        teamName:
 *          type: string
 *        teamSlug:
 *          type: string
 */
export type BatchLookupResponse = BatchItem & {
  commentCount: number
  suiteName: string
  suiteSlug: string
  teamName: string
  teamSlug: string
}

/**
 * @schema CT_BatchListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_BatchItem'
 */
export type BatchListResponse = BatchItem[]

/**
 * @schema CT_CommentItem
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - at
 *    - by
 *    - id
 *    - replies
 *    - text
 *  properties:
 *    at:
 *      type: string
 *      format: date-time
 *    by:
 *      $ref: '#/components/schemas/CT_Userinfo'
 *    editedAt:
 *      type: string
 *      format: date-time
 *    id:
 *      type: string
 *    replies:
 *      type: array
 *      items:
 *        - $ref: '#/components/schemas/CT_CommentItem'
 *    text:
 *      type: string
 */
export type CommentItem = {
  at: Date
  by: Userinfo
  editedAt?: Date
  id: string
  replies: CommentItem[]
  text: string
}

/**
 * @schema CT_CommentListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_CommentItem'
 */
export type CommentListResponse = CommentItem[]

/**
 * @schema CT_SuiteItem
 *  type: object
 *  additionalProperties: false
 *  required:
 *    - batchCount
 *    - suiteName
 *    - suiteSlug
 *  properties:
 *    baseline:
 *      $ref: '#/components/schemas/CT_BatchItemRaw'
 *    batchCount:
 *      type: number
 *    latest:
 *      $ref: '#/components/schemas/CT_BatchItemRaw'
 *    overview:
 *      $ref: '#/components/schemas/CT_BatchCompareOverview'
 *    suiteName:
 *      type: string
 *    suiteSlug:
 *      type: string
 */
export type SuiteItem = {
  baseline?: BatchItemRaw
  batchCount: number
  latest?: BatchItemRaw
  overview?: BatchCompareOverview
  suiteName: string
  suiteSlug: string
}

/**
 * @schema CT_SuiteLookupResponse
 *  allOf:
 *    - $ref: '#/components/schemas/CT_SuiteItem'
 *    - type: object
 *      additionalProperties: false
 *      required:
 *        - batches
 *        - isSubscribed
 *        - promotions
 *        - retainFor
 *        - sealAfter
 *        - subscriberCount
 *        - teamName
 *        - teamSlug
 *      properties:
 *        batches:
 *          type: array
 *          items:
 *            type: string
 *        isSubscribed:
 *          type: boolean
 *        promotions:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/CT_Promotion'
 *        retainFor:
 *          type: number
 *        sealAfter:
 *          type: number
 *        teamName:
 *          type: string
 *        teamSlug:
 *          type: string
 */
export type SuiteLookupResponse = SuiteItem & {
  batches: string[]
  isSubscribed: boolean
  promotions: Promotion[]
  retainFor: number
  sealAfter: number
  subscriberCount: number
  teamName: string
  teamSlug: string
}

/**
 * @schema CT_SuiteListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_SuiteItem'
 */
export type SuiteListResponse = SuiteItem[]

/**
 * @schema CT_CppTestcaseOverview
 *  additionalProperties: false
 *  type: object
 *  properties:
 *    keysCount:
 *      type: number
 *    metricsCount:
 *      type: number
 *    metricsDuration:
 *      type: number
 */
export type CppTestcaseOverview = {
  keysCount: number
  metricsCount: number
  metricsDuration: number
}

/**
 * @schema CT_CppTestcaseComparisonOverview
 *  additionalProperties: false
 *  type: object
 *  properties:
 *    keysCountCommon:
 *      type: number
 *      format: int32
 *    keysCountFresh:
 *      type: number
 *      format: int32
 *    keysCountMissing:
 *      type: number
 *      format: int32
 *    keysScore:
 *      type: number
 *      format: float
 *    metricsCountCommon:
 *      type: number
 *      format: int32
 *    metricsCountFresh:
 *      type: number
 *      format: int32
 *    metricsCountMissing:
 *      type: number
 *      format: int32
 *    metricsDurationCommonDst:
 *      type: number
 *      format: int32
 *    metricsDurationCommonSrc:
 *      type: number
 *      format: int32
 */
export type CppTestcaseComparisonOverview = {
  keysCountCommon: number
  keysCountFresh: number
  keysCountMissing: number
  keysScore: number
  metricsCountCommon: number
  metricsCountFresh: number
  metricsCountMissing: number
  metricsDurationCommonDst: number
  metricsDurationCommonSrc: number
}

/**
 * @schema CT_BatchComparisonItem
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - builtAt
 *    - elementName
 *  properties:
 *    builtAt:
 *      type: string
 *      format: date-time
 *    elementName:
 *      type: string
 */
export type BatchComparisonItem = {
  builtAt: Date
  elementName: string
}

/**
 * @schema CT_BatchComparisonItemCommon
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - dst
 *    - src
 *  properties:
 *    dst:
 *      $ref: '#/components/schemas/CT_BatchComparisonItem'
 *    meta:
 *      $ref: '#/components/schemas/CT_CppTestcaseComparisonOverview'
 *    src:
 *      $ref: '#/components/schemas/CT_BatchComparisonItem'
 */
type BatchComparisonItemCommon = {
  dst: BatchComparisonItem
  meta?: CppTestcaseComparisonOverview
  src: BatchComparisonItem
}

/**
 * @schema CT_BatchComparisonItemSolo
 *  allOf:
 *    - $ref: '#/components/schemas/CT_BatchComparisonItem'
 *    - type: object
 *      properties:
 *        meta:
 *          $ref: '#/components/schemas/CT_CppTestcaseOverview'
 */
type BatchComparisonItemSolo = BatchComparisonItem & {
  meta?: CppTestcaseOverview
}

/**
 * @schema CT_BatchComparisonResponse
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - common
 *    - fresh
 *    - missing
 *  properties:
 *    common:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_BatchComparisonItemCommon'
 *    fresh:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_BatchComparisonItemSolo'
 *    missing:
 *      type: array
 *      items:
 *        $ref: '#/components/schemas/CT_BatchComparisonItemSolo'
 *    overview:
 *      $ref: '#/components/schemas/CT_BatchCompareOverview'
 */
export type BatchComparisonResponse = {
  common: BatchComparisonItemCommon[]
  fresh: BatchComparisonItemSolo[]
  missing: BatchComparisonItemSolo[]
  overview?: BatchCompareOverview
}

/**
 * @schema CT_ElementListResponseItem
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - metricsDuration
 *    - name
 *  properties:
 *    metricsDuration:
 *      type: number
 *    name:
 *      type: string
 */
type ElementListResponseItem = {
  metricsDuration: number
  name: string
}

/**
 * @schema CT_ElementListResponse
 *  type: array
 *  items:
 *    $ref: '#/components/schemas/CT_ElementListResponseItem'
 */
export type ElementListResponse = ElementListResponseItem[]

/**
 * @schema CT_ElementLookupResponse
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - batches
 *    - elementName
 *    - elementSlug
 *    - suiteName
 *    - suiteSlug
 *    - teamName
 *    - teamSlug
 *  properties:
 *    batches:
 *      type: array
 *      items:
 *        type: object
 *        properties:
 *          slug:
 *            type: string
 *          submittedAt:
 *            type: Date
 *          updatedAt:
 *            type: Date
 *    elementName:
 *      type: string
 *    elementSlug:
 *      type: string
 *    suiteName:
 *      type: string
 *    suiteSlug:
 *      type: string
 *    teamName:
 *      type: string
 *    teamSlug:
 *      type: string
 */
export type ElementLookupResponse = {
  batches: {
    slug: string
    submittedAt: Date
    updatedAt: Date
  }[];
  elementName: string
  elementSlug: string
  suiteName: string
  suiteSlug: string
  teamName: string
  teamSlug: string
}

/**
 * @schema CT_ElementComparisonItem
 *  allOf:
 *    - $ref: '#/components/schemas/CT_BatchComparisonItem'
 *    - type: object
 *      required:
 *        - submittedAt
 *        - submittedBy
 *      properties:
 *        submittedAt:
 *          type: string
 *          format: date-time
 *        submittedBy:
 *          $ref: '#/components/schemas/CT_Userinfo'
 */
type ElementComparisonItem = BatchComparisonItem & {
  submittedAt: Date
  submittedBy: Userinfo
}

/**
 * @schema CT_CppTypeComparison
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - name
 *  properties:
 *    desc:
 *      type: array
 *      items:
 *        type: string
 *    dstType:
 *      type: string
 *    dstValue:
 *      type: string
 *    name:
 *      type: string
 *    score:
 *      type: number
 *      format: float
 *    srcType:
 *      type: string
 *    srcValue:
 *      type: string
 */
export type CppTypeComparison = {
  desc?: string[]
  dstType?: string
  dstValue?: string
  name: string
  score?: number
  srcType?: string
  srcValue?: string
}

/**
 * @schema CT_CppCellar
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - commonKeys
 *    - missingKeys
 *    - newKeys
 *  properties:
 *    commonKeys:
 *      type: array
 *      items:
 *        - $ref: '#/components/schemas/CT_CppTypeComparison'
 *    missingKeys:
 *      type: array
 *      items:
 *        - $ref: '#/components/schemas/CT_CppTypeComparison'
 *    newKeys:
 *      type: array
 *      items:
 *        - $ref: '#/components/schemas/CT_CppTypeComparison'
 */
type CppCellar = {
  commonKeys: CppTypeComparison[]
  missingKeys: CppTypeComparison[]
  newKeys: CppTypeComparison[]
}

/**
 * @schema CT_CppTestcaseMetadata
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - builtAt
 *    - teamSlug
 *    - testcase
 *    - testsuite
 *    - version
 *  properties:
 *    builtAt:
 *      type: string
 *      format: date-time
 *    teamSlug:
 *      type: string
 *    testcase:
 *      type: string
 *    testsuite:
 *      type: string
 *    version:
 *      type: string
 */
type CppTestcaseMetadata = {
  builtAt: Date
  teamslug: string
  testcase: string
  testsuite: string
  version: string
}

/**
 * @schema CT_CppTestcaseComparison
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - assertions
 *    - dst
 *    - metrics
 *    - results
 *    - src
 *  properties:
 *    assertions:
 *      $ref: '#/components/schemas/CT_CppCellar'
 *    dst:
 *      $ref: '#/components/schemas/CT_CppTestcaseMetadata'
 *    metrics:
 *      $ref: '#/components/schemas/CT_CppCellar'
 *    results:
 *      $ref: '#/components/schemas/CT_CppCellar'
 *    src:
 *      $ref: '#/components/schemas/CT_CppTestcaseMetadata'
 */
type CppTestcaseComparison = {
  assertions: CppCellar
  dst: CppTestcaseMetadata
  metrics: CppCellar
  results: CppCellar
  src: CppTestcaseMetadata
}

/**
 * @schema CT_ElementComparisonResponse
 *  additionalProperties: false
 *  type: object
 *  required:
 *    - dst
 *    - src
 *  properties:
 *    cmp:
 *      $ref: '#/components/schemas/CT_CppTestcaseComparison'
 *    dst:
 *      $ref: '#/components/schemas/CT_ElementComparisonItem'
 *    meta:
 *      $ref: '#/components/schemas/CT_CppTestcaseComparisonOverview'
 *    src:
 *      $ref: '#/components/schemas/CT_ElementComparisonItem'
 */
export type ElementComparisonResponse = {
  cmp?: CppTestcaseComparison
  dst: ElementComparisonItem
  meta?: CppTestcaseComparisonOverview
  src: ElementComparisonItem
}
