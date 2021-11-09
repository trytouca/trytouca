// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ETeamRole,
  SuiteListResponse,
  SuiteLookupResponse,
  TeamInvitee,
  TeamItem,
  TeamListResponse,
  TeamLookupResponse,
  TeamMember,
  TeamMemberListResponse
} from '@/core/models/commontypes';
import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';
import { PageTab } from '@/home/components';
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
    icon: 'tasks',
    icon2: 'feather-list',
    shown: true
  },
  [TeamPageTabType.Members]: {
    type: TeamPageTabType.Members,
    name: 'Members',
    link: 'members',
    icon: 'users',
    icon2: 'feather-users',
    shown: true
  },
  [TeamPageTabType.Settings]: {
    type: TeamPageTabType.Settings,
    name: 'Settings',
    link: 'settings',
    icon: 'cog',
    icon2: 'feather-settings',
    shown: true
  },
  [TeamPageTabType.FirstTeam]: {
    type: TeamPageTabType.FirstTeam,
    name: 'New Team',
    link: 'first-team',
    icon: 'cog',
    icon2: 'feather-plus-circle',
    shown: true
  },
  [TeamPageTabType.Invitations]: {
    type: TeamPageTabType.Invitations,
    name: 'Invitations',
    link: 'invitations',
    icon: 'cog',
    icon2: 'feather-gift',
    shown: true
  },
  [TeamPageTabType.Requests]: {
    type: TeamPageTabType.Requests,
    name: 'Requests',
    link: 'requests',
    icon: 'cog',
    icon2: 'feather-send',
    shown: true
  }
};

@Injectable()
export class TeamPageService extends IPageService<TeamPageSuite> {
  private _bannerSubject = new Subject<TeamBannerType>();
  banner$ = this._bannerSubject.asObservable();

  private _tabsSubject = new Subject<PageTab<TeamPageTabType>[]>();
  tabs$ = this._tabsSubject.asObservable();

  private _teams: RefinedTeamList;
  private _teamsSubject = new Subject<RefinedTeamList>();
  teams$ = this._teamsSubject.asObservable();

  private _team: TeamLookupResponse;
  private _teamSubject = new Subject<TeamLookupResponse>();
  team$ = this._teamSubject.asObservable();

  private _members: TeamPageMember[];
  private _membersSubject = new Subject<TeamPageMember[]>();
  members$ = this._membersSubject.asObservable();

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private apiService: ApiService
  ) {
    super();
  }

  /**
   * Find list of all my teams.
   */
  public init(params: { team?: string } = {}) {
    this.apiService.get<TeamListResponse>('team').subscribe({
      next: (doc) => {
        const byRole = (...roles: ETeamRole[]) =>
          doc.filter((v) => roles.includes(v.role));
        const teams: RefinedTeamList = {
          requests: byRole(ETeamRole.Applicant),
          invitations: byRole(ETeamRole.Invited),
          active: byRole(ETeamRole.Owner, ETeamRole.Admin, ETeamRole.Member)
        };
        if (!params.team && teams.active.length) {
          this._teamsSubject.next(teams);
          return;
        }
        if (params.team && !teams.active.some((v) => v.slug === params.team)) {
          this._bannerSubject.next(TeamBannerType.TeamNotFound);
          return;
        }
        const activeTabs: PageTab<TeamPageTabType>[] = [];
        if (teams.active.length) {
          activeTabs.push(
            availableTabs.suites,
            availableTabs.members,
            availableTabs.settings
          );
        } else {
          activeTabs.push(availableTabs.firstTeam);
        }
        if (teams.invitations.length) {
          activeTabs.push(availableTabs.invitations);
        }
        if (teams.requests.length) {
          activeTabs.push(availableTabs.requests);
        }
        this._tabsSubject.next(activeTabs);
        this._teams = teams;
        this._teamsSubject.next(teams);
        if (!teams.active.length) {
          return;
        }
        const activeTeam =
          params.team ??
          localStorage.getItem(ELocalStorageKey.LastVisitedTeam) ??
          teams.active[0].slug;
        this.fetchItems({ teamSlug: activeTeam });
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  /**
   * Learn more about this team.
   *
   * For better user experience, we like to memorize the last team user
   * has interacted with, so that when they navigate to other parts of
   * the web app, they can skip the "team list" page. To do so we
   * use local storage (if it is enabled).
   * We perform this operation here to limit it to teams with valid slugs.
   */
  private fetchTeam(args: FetchInput): Observable<TeamLookupResponse> {
    const url = ['team', args.teamSlug].join('/');
    return this.apiService.get<TeamLookupResponse>(url).pipe(
      map((doc: TeamLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._team)) {
          return doc;
        }
        this._team = doc;
        this._teamSubject.next(this._team);

        try {
          localStorage.setItem(ELocalStorageKey.LastVisitedTeam, args.teamSlug);
        } catch (err) {
          errorLogger.notify(err);
        }
        return doc;
      })
    );
  }

  /**
   * Find list of all suites in this team.
   */
  private fetchSuites(args: FetchInput): Observable<TeamPageSuite[]> {
    const url = ['suite', args.teamSlug].join('/');
    return this.apiService.get<SuiteListResponse>(url).pipe(
      map((doc: SuiteListResponse) => {
        if (!doc) {
          return;
        }
        const items = doc.map((item) => {
          const suite = item as SuiteLookupResponse;
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
        if (isEqual(items, this._items)) {
          return items;
        }
        this._items = items;
        this._itemsSubject.next(this._items);
        return items;
      })
    );
  }

  /**
   * Find list of all members in this team.
   */
  private fetchMembers(args: FetchInput): Observable<TeamPageMember[]> {
    const url = ['team', args.teamSlug, 'member'].join('/');
    return this.apiService.get<TeamMemberListResponse>(url).pipe(
      map((doc: TeamMemberListResponse) => {
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
        if (isEqual(this._members, items)) {
          return items;
        }
        this._members = items;
        this._membersSubject.next(this._members);
        return items;
      })
    );
  }

  /**
   *
   */
  public fetchItems(args: FetchInput): void {
    const onetime: Observable<unknown>[] = [of(0)];

    if (!this._teams) {
      this.init();
    }
    if (!this._team) {
      onetime.push(this.fetchTeam(args));
    }
    if (!this._members) {
      onetime.push(this.fetchMembers(args));
    }
    if (!this._items) {
      onetime.push(this.fetchSuites(args));
    }

    forkJoin(onetime).subscribe({
      next: () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound
        );
      },
      error: (err) => {
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

  /**
   * Updates new information to all components of the team page in the event
   * that the team slug changes during the lifetime of this page.
   *
   * Team slug may change in two cases:
   *  - User switches to another team
   *  - User updates slug of this team
   */
  public updateTeamSlug(teamSlug: string): void {
    this._team = null;
    this._members = null;
    this._items = null;
    this.fetchItems({ teamSlug });
  }

  /**
   * Used by first-suite when new suite is created.
   */
  public refreshSuites() {
    this._items = null;
    this.fetchItems({ teamSlug: this._team.slug });
  }

  /**
   *
   */
  public refreshMembers(): void {
    this._members = null;
    this.fetchItems({ teamSlug: this._team.slug });
  }

  public refreshTeams(nextTeam?: string) {
    const teamSlug = nextTeam ?? this._team?.slug;
    this._teams = null;
    this._team = null;
    this._members = null;
    this._items = null;
    this.init({ team: teamSlug });
  }

  /**
   *
   */
  public removeInvitee(invitee: TeamInvitee): void {
    const index = this._members.findIndex((v) => {
      return (
        v.type === TeamPageMemberType.Invitee &&
        v.asInvitee().email === invitee.email
      );
    });
    this._members.splice(index, 1);
    this._membersSubject.next(this._members);
  }

  /**
   *
   */
  public removeMember(member: TeamMember): void {
    const index = this._members.findIndex((v) => {
      return (
        v.type === TeamPageMemberType.Member &&
        v.asMember().username === member.username
      );
    });
    this._members.splice(index, 1);
    this._membersSubject.next(this._members);
  }
}
