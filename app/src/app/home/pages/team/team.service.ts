// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  ETeamRole,
  ServerEventJob,
  SuiteLookupResponse,
  TeamInvitee,
  TeamItem,
  TeamListResponse,
  TeamLookupResponse,
  TeamMember,
  TeamMemberListResponse
} from '@touca/api-schema';
import { isEqual } from 'lodash-es';
import { forkJoin, of, Subject } from 'rxjs';

import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import { TeamPageMember, TeamPageSuite } from './team.model';

export type TeamPageTabType =
  | 'suites'
  | 'members'
  | 'settings'
  | 'invitations'
  | 'requests'
  | 'firstTeam';

export type TeamBannerType = 'team-not-found';

type FetchInput = {
  teamSlug: string;
};

export type RefinedTeamList = Record<
  'active' | 'invitations' | 'requests',
  TeamItem[]
>;

@Injectable()
export class TeamPageService extends IPageService<TeamPageSuite> {
  private cache: Partial<{
    members: Array<TeamPageMember>;
    tab: TeamPageTabType;
    tabs: Array<TeamPageTabType>;
    team: TeamLookupResponse;
    teams: RefinedTeamList;
  }> = { tab: 'suites' };

  private subjects = {
    banner: new Subject<TeamBannerType>(),
    members: new Subject<Array<TeamPageMember>>(),
    tab: new Subject<TeamPageTabType>(),
    tabs: new Subject<Array<TeamPageTabType>>(),
    team: new Subject<TeamLookupResponse>(),
    teams: new Subject<RefinedTeamList>()
  };

  data = {
    banner$: this.subjects.banner.asObservable(),
    members$: this.subjects.members.asObservable(),
    tab$: this.subjects.tab.asObservable(),
    tabs$: this.subjects.tabs.asObservable(),
    team$: this.subjects.team.asObservable(),
    teams$: this.subjects.teams.asObservable()
  };

  constructor(
    private alertService: AlertService,
    private apiService: ApiService
  ) {
    super();
  }

  consumeEvent(job: ServerEventJob) {
    if (
      this.cache.tab === 'suites' &&
      ['suite:created', 'suite:updated'].includes(job.type)
    ) {
      this.fetchItems({ teamSlug: this.cache.team.slug });
    }
  }

  private update(key: string, response: unknown) {
    if (response && !isEqual(response, this.cache[key])) {
      this.cache[key] = response;
      (this.subjects[key] as Subject<unknown>).next(response);
    }
  }

  private prepareTeams(doc: TeamListResponse) {
    if (!doc) {
      return;
    }
    const byRole = (...roles: ETeamRole[]) =>
      doc.filter((v) => roles.includes(v.role));
    const teams: RefinedTeamList = {
      requests: byRole('applicant'),
      invitations: byRole('invited'),
      active: byRole('owner', 'admin', 'member')
    };
    this.update('teams', teams);
  }

  private prepareTabs() {
    const tabs: Array<TeamPageTabType> = [];
    if (this.cache.teams.active.length) {
      tabs.push('suites', 'members', 'settings');
    } else {
      tabs.push('firstTeam');
    }
    if (this.cache.teams.invitations.length) {
      tabs.push('invitations');
    }
    if (this.cache.teams.requests.length) {
      tabs.push('requests');
    }
    this.update('tabs', tabs);
  }

  private prepareTeam(doc: TeamLookupResponse) {
    if (!doc || isEqual(doc, this.cache.team)) {
      return;
    }
    this.cache.team = doc;
    this.subjects.team.next(doc);
    try {
      localStorage.setItem(ELocalStorageKey.LastVisitedTeam, doc.slug);
    } catch (err) {
      errorLogger.notify(err as Error);
    }
  }

  private prepareSuites(doc: SuiteLookupResponse[]) {
    if (!doc) {
      return;
    }
    const suites = doc.map((item) => {
      const suite = item;
      const batches = [];
      if (suite.baseline) {
        batches.push(suite.baseline.batchSlug);
      }
      if (suite.latest) {
        batches.push(suite.latest.batchSlug);
      }
      suite.batches = batches;
      return new TeamPageSuite(suite, 'suite');
    });
    if (suites && !isEqual(suites, this._items)) {
      this._items = suites;
      this._itemsSubject.next(suites);
    }
  }

  private prepareMembers(doc: TeamMemberListResponse) {
    if (!doc) {
      return;
    }
    this.update('members', [
      ...doc.applicants.map((v) => new TeamPageMember(v, 'applicant')),
      ...doc.invitees.map((v) => new TeamPageMember(v, 'invitee')),
      ...doc.members.map((v) => new TeamPageMember(v, 'member'))
    ]);
  }

  public fetchItems(args: FetchInput): void {
    const url = {
      teams: ['team'],
      team: args.teamSlug ? ['team', args.teamSlug] : undefined,
      suites: args.teamSlug ? ['suite', args.teamSlug] : undefined,
      members: args.teamSlug ? ['team', args.teamSlug, 'member'] : undefined
    };
    const elements = Object.keys(url).filter((v) => Boolean(url[v]));
    const requests = elements.map((key) => {
      return this.cache[key]
        ? of(0)
        : this.apiService.get<unknown>((url[key] as string[]).join('/'));
    });
    forkJoin(requests).subscribe({
      next: (doc) => {
        this.prepareTeams(doc[0] as TeamListResponse);
        this.prepareTeam(doc[1] as TeamLookupResponse);
        this.prepareSuites(doc[2] as SuiteLookupResponse[]);
        this.prepareMembers(doc[3] as TeamMemberListResponse);
        this.prepareTabs();
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound
        );
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.alertService.set(
            !this._items
              ? AlertKind.ApiConnectionDown
              : AlertKind.ApiConnectionLost
          );
        } else if (err.status === 401) {
          this.alertService.set(AlertKind.InvalidAuthToken);
        } else if (err.status === 404) {
          this.alertService.set(AlertKind.TeamNotFound);
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  public updateCurrentTab(tab: TeamPageTabType) {
    this.cache.tab = tab;
    this.subjects.tab.next(tab);
  }

  /**
   * Updates new information to all components of the team page in the event
   * that the team slug changes during the lifetime of this page.
   *
   * Team slug may change in two cases:
   *  - User switches to another team
   *  - User updates slug of this team
   */
  public updateTeamSlug(teamSlug: string): void {
    this.cache.team = null;
    this.cache.members = null;
    this._items = null;
    this.fetchItems({ teamSlug });
  }

  /**
   * Used by first-suite when new suite is created.
   */
  public refreshSuites() {
    this._items = null;
    this.fetchItems({ teamSlug: this.cache.team.slug });
  }

  public refreshMembers(): void {
    this.cache.members = null;
    this.fetchItems({ teamSlug: this.cache.team.slug });
  }

  public refreshTeams(nextTeam?: string) {
    const teamSlug = nextTeam ?? this.cache.team?.slug;
    this.cache.teams = null;
    this.cache.team = null;
    this.cache.members = null;
    this._items = null;
    this.fetchItems({ teamSlug });
  }

  public removeInvitee(invitee: TeamInvitee): void {
    const index = this.cache.members.findIndex((v) => {
      return v.type === 'invitee' && v.asInvitee().email === invitee.email;
    });
    this.cache.members.splice(index, 1);
    this.subjects.members.next(this.cache.members);
  }

  public removeMember(member: TeamMember): void {
    const index = this.cache.members.findIndex((v) => {
      return v.type === 'member' && v.asMember().username === member.username;
    });
    this.cache.members.splice(index, 1);
    this.subjects.members.next(this.cache.members);
  }

  public submitSampleData() {
    const team = this.cache.team?.slug;
    return this.apiService.post(`/team/${team}/populate`);
  }
}
