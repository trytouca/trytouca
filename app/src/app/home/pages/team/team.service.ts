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
import { PageTab } from '@/home/components';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import {
  TeamPageMember,
  TeamPageMemberType,
  TeamPageSuite,
  TeamPageSuiteType
} from './team.model';

export enum TeamPageTabType {
  Suites = 'suites',
  Members = 'members',
  Settings = 'settings',
  Invitations = 'invitations',
  Requests = 'requests',
  FirstTeam = 'firstTeam'
}

export enum TeamBannerType {
  TeamNotFound = 'not-found'
}

type FetchInput = {
  teamSlug: string;
};

export type RefinedTeamList = Record<
  'active' | 'invitations' | 'requests',
  TeamItem[]
>;

const availableTabs: Record<TeamPageTabType, PageTab<TeamPageTabType>> = {
  [TeamPageTabType.Suites]: {
    type: TeamPageTabType.Suites,
    name: 'Suites',
    link: 'suites',
    icon: 'feather-list',
    shown: true
  },
  [TeamPageTabType.Members]: {
    type: TeamPageTabType.Members,
    name: 'Members',
    link: 'members',
    icon: 'feather-users',
    shown: true
  },
  [TeamPageTabType.Settings]: {
    type: TeamPageTabType.Settings,
    name: 'Settings',
    link: 'settings',
    icon: 'feather-settings',
    shown: true
  },
  [TeamPageTabType.FirstTeam]: {
    type: TeamPageTabType.FirstTeam,
    name: 'New Team',
    link: 'first-team',
    icon: 'feather-plus-circle',
    shown: true
  },
  [TeamPageTabType.Invitations]: {
    type: TeamPageTabType.Invitations,
    name: 'Invitations',
    link: 'invitations',
    icon: 'feather-gift',
    shown: true
  },
  [TeamPageTabType.Requests]: {
    type: TeamPageTabType.Requests,
    name: 'Requests',
    link: 'requests',
    icon: 'feather-send',
    shown: true
  }
};

@Injectable()
export class TeamPageService extends IPageService<TeamPageSuite> {
  private _bannerSubject = new Subject<TeamBannerType>();
  banner$ = this._bannerSubject.asObservable();
  private _eventSource: EventSource;
  private _eventSubject = new Subject<ServerEventJob>();
  events$ = this._eventSubject.asObservable();

  private _cache: {
    tab: TeamPageTabType;
    tabs: PageTab<TeamPageTabType>[];
    teams: RefinedTeamList;
    team: TeamLookupResponse;
    members: TeamPageMember[];
  } = {
    tab: TeamPageTabType.Suites,
    tabs: undefined,
    teams: undefined,
    team: undefined,
    members: undefined
  };

  private _subjects = {
    tab: new Subject<PageTab<TeamPageTabType>>(),
    tabs: new Subject<PageTab<TeamPageTabType>[]>(),
    teams: new Subject<RefinedTeamList>(),
    team: new Subject<TeamLookupResponse>(),
    members: new Subject<TeamPageMember[]>()
  };

  data = {
    tab$: this._subjects.tab.asObservable(),
    tabs$: this._subjects.tabs.asObservable(),
    teams$: this._subjects.teams.asObservable(),
    team$: this._subjects.team.asObservable(),
    members$: this._subjects.members.asObservable()
  };

  constructor(
    private alertService: AlertService,
    private apiService: ApiService
  ) {
    super();
  }

  eventSourceSubscribe(teamSlug: string) {
    const path = ['team', teamSlug, 'events'].join('/');
    const url = this.apiService.makeUrl(path);
    this._eventSource = new EventSource(url, { withCredentials: true });
    this._eventSource.addEventListener('error', (e) => console.error(e));
    this._eventSource.addEventListener('message', (msg) => {
      const job: ServerEventJob = JSON.parse(msg.data as string);
      this._eventSubject.next(job);
    });
  }

  consumeEvent(job: ServerEventJob) {
    if (
      this._cache.tab === TeamPageTabType.Suites &&
      ['suite:created', 'batch:processed', 'batch:sealed'].includes(job.type)
    ) {
      this.fetchItems({ teamSlug: this._cache.team.slug });
    }
  }

  eventSourceUnsubscribe() {
    this._eventSource.removeAllListeners();
    this._eventSource.close();
  }

  private update(key: string, response: unknown) {
    if (response && !isEqual(response, this._cache[key])) {
      this._cache[key] = response;
      (this._subjects[key] as Subject<unknown>).next(response);
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
    const activeTabs: PageTab<TeamPageTabType>[] = [];
    if (this._cache.teams.active.length) {
      activeTabs.push(
        availableTabs.suites,
        availableTabs.members,
        availableTabs.settings
      );
    } else {
      activeTabs.push(availableTabs.firstTeam);
    }
    if (this._cache.teams.invitations.length) {
      activeTabs.push(availableTabs.invitations);
    }
    if (this._cache.teams.requests.length) {
      activeTabs.push(availableTabs.requests);
    }
    this.update('tabs', activeTabs);
  }

  private prepareTeam(doc: TeamLookupResponse) {
    if (!doc || isEqual(doc, this._cache.team)) {
      return;
    }
    this._cache.team = doc;
    this._subjects.team.next(doc);
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
      return new TeamPageSuite(suite, TeamPageSuiteType.Suite);
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
    const applicants = doc.applicants.map(
      (v) => new TeamPageMember(v, TeamPageMemberType.Applicant)
    );
    const invitees = doc.invitees.map(
      (v) => new TeamPageMember(v, TeamPageMemberType.Invitee)
    );
    const members = doc.members.map(
      (v) => new TeamPageMember(v, TeamPageMemberType.Member)
    );
    const items = [...applicants, ...invitees, ...members];
    this.update('members', items);
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
      return this._cache[key]
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

  public updateCurrentTab(tab: PageTab<TeamPageTabType>) {
    this._cache.tab = tab.type;
    this._subjects.tab.next(tab);
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
    this._cache.team = null;
    this._cache.members = null;
    this._items = null;
    this.fetchItems({ teamSlug });
  }

  /**
   * Used by first-suite when new suite is created.
   */
  public refreshSuites() {
    this._items = null;
    this.fetchItems({ teamSlug: this._cache.team.slug });
  }

  public refreshMembers(): void {
    this._cache.members = null;
    this.fetchItems({ teamSlug: this._cache.team.slug });
  }

  public refreshTeams(nextTeam?: string) {
    const teamSlug = nextTeam ?? this._cache.team?.slug;
    this._cache.teams = null;
    this._cache.team = null;
    this._cache.members = null;
    this._items = null;
    this.fetchItems({ teamSlug });
  }

  public removeInvitee(invitee: TeamInvitee): void {
    const index = this._cache.members.findIndex((v) => {
      return (
        v.type === TeamPageMemberType.Invitee &&
        v.asInvitee().email === invitee.email
      );
    });
    this._cache.members.splice(index, 1);
    this._subjects.members.next(this._cache.members);
  }

  public removeMember(member: TeamMember): void {
    const index = this._cache.members.findIndex((v) => {
      return (
        v.type === TeamPageMemberType.Member &&
        v.asMember().username === member.username
      );
    });
    this._cache.members.splice(index, 1);
    this._subjects.members.next(this._cache.members);
  }

  public submitSampleData() {
    const team = this._cache.team?.slug;
    return this.apiService.post(`/team/${team}/populate`);
  }
}
