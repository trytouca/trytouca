// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { components } from './schema.gen'

type schemas = components['schemas']

export type EFeatureFlag = schemas['CT_EFeatureFlag']

export type EPlatformRole = schemas['CT_EPlatformRole']

export type ENotificationType = schemas['CT_ENotificationType']

export type Userinfo = schemas['CT_Userinfo']

export type UserLookupResponse = schemas['CT_UserLookupResponse']

export type NotificationItem = schemas['CT_NotificationItem']

export type NotificationListResponse = schemas['CT_NotificationListResponse']

export type ETeamRole = schemas['CT_ETeamRole']

export type TeamItem = schemas['CT_TeamItem']

export type TeamLookupResponse = schemas['CT_TeamLookupResponse']

export type TeamListResponse = schemas['CT_TeamListResponse']

export type TeamMember = schemas['CT_TeamMember']

export type TeamInvitee = schemas['CT_TeamInvitee']

export type TeamApplicant = schemas['CT_TeamApplicant']

export type TeamMemberListResponse = schemas['CT_TeamMemberListResponse']

export type Promotion = schemas['CT_Promotion']

export type BatchCompareOverview = schemas['CT_BatchCompareOverview']

export type BatchItemRaw = schemas['CT_BatchItemRaw']

export type BatchItem = schemas['CT_BatchItem']

export type BatchLookupResponse = schemas['CT_BatchLookupResponse']

export type BatchListResponse = schemas['CT_BatchListResponse']

export type CommentItem = schemas['CT_CommentItem']

export type CommentListResponse = schemas['CT_CommentListResponse']

export type SuiteItem = schemas['CT_SuiteItem']

export type SuiteLookupResponse = schemas['CT_SuiteLookupResponse']

export type SuiteListResponse = schemas['CT_SuiteListResponse']

export type CppTestcaseOverview = schemas['CT_CppTestcaseOverview']

export type CppTestcaseComparisonOverview =
  schemas['CT_CppTestcaseComparisonOverview']

export type BatchComparisonItem = schemas['CT_BatchComparisonItem']

export type BatchComparisonItemCommon = schemas['CT_BatchComparisonItemCommon']

export type BatchComparisonItemSolo = schemas['CT_BatchComparisonItemSolo']

export type BatchComparisonResponse = schemas['CT_BatchComparisonResponse']

export type ElementListResponseItem = schemas['CT_ElementListResponseItem']

export type ElementListResponse = schemas['CT_ElementListResponse']

export type ElementLookupResponse = schemas['CT_ElementLookupResponse']

export type ElementComparisonItem = schemas['CT_ElementComparisonItem']

export type CppTypeComparison = schemas['CT_CppTypeComparison']

export type CppCellar = schemas['CT_CppCellar']

export type CppTestcaseMetadata = schemas['CT_CppTestcaseMetadata']

export type CppTestcaseComparison = schemas['CT_CppTestcaseComparison']

export type ElementComparisonResponse = schemas['CT_ElementComparisonResponse']

export type PlatformConfig = schemas['CT_PlatformConfig']

export type PlatformStatus = schemas['CT_PlatformStatus']

export type PlatformStatsUser = schemas['CT_PlatformStatsUser']

export type PlatformStatsResponse = schemas['CT_PlatformStatsResponse']

export type UserSessionsResponseItem = schemas['CT_UserSessionsResponseItem']
