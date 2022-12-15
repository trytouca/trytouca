// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type {
  SuiteLookupResponse,
  TeamApplicant,
  TeamInvitee,
  TeamMember
} from '@touca/api-schema';

import { PageListItem } from '@/home/models/page-list-item.model';

type DataType = TeamMember | TeamInvitee | TeamApplicant;
type TeamPageSuiteType = 'suite';
type TeamPageMemberType = 'applicant' | 'invitee' | 'member';

export class TeamPageMember extends PageListItem<DataType, TeamPageMemberType> {
  public constructor(data: DataType, type: TeamPageMemberType) {
    super(data, type);
  }
  public asMember(): TeamMember {
    return this.data as TeamMember;
  }
  public asInvitee(): TeamInvitee {
    return this.data as TeamInvitee;
  }
  public asApplicant(): TeamApplicant {
    return this.data as TeamApplicant;
  }
}

export class TeamPageSuite extends PageListItem<
  SuiteLookupResponse,
  TeamPageSuiteType
> {
  public constructor(data: SuiteLookupResponse, type: TeamPageSuiteType) {
    super(data, type);
  }
}
