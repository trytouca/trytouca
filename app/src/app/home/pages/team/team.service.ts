/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import type {
  SuiteListResponse,
  SuiteLookupResponse,
  TeamInvitee,
  TeamListResponse,
  TeamLookupResponse,
  TeamMember,
  TeamMemberListResponse
} from '@weasel/core/models/commontypes';
import { ETeamRole } from '@weasel/core/models/commontypes';
import { ELocalStorageKey } from '@weasel/core/models/frontendtypes';
import {
  AlertKind,
  AlertService,
  ApiService,
  UserService
} from '@weasel/core/services';
import { IPageService } from '@weasel/home/models/pages.model';
import { errorLogger } from '@weasel/shared/utils/errorLogger';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  TeamPageMember,
  TeamPageMemberType,
  TeamPageSuite,
  TeamPageSuiteType
} from './team.model';

export enum TeamPageTabType {
  Suites = 'suites',
  Members = 'members',
  Settings = 'settings'
}

type FetchInput = {
  currentTab: string;
  teamSlug: string;
};

@Injectable()
export class TeamPageService extends IPageService<TeamPageSuite> {
  private _team: TeamLookupResponse;
  private _teamSubject = new Subject<TeamLookupResponse>();
  team$ = this._teamSubject.asObservable();

  private _teams: TeamListResponse;
  private _teamsCache: TeamListResponse;
  private _teamsSubject = new Subject<TeamListResponse>();
  teams$ = this._teamsSubject.asObservable();

  private _members: TeamPageMember[];
  private _membersSubject = new Subject<TeamPageMember[]>();
  members$ = this._membersSubject.asObservable();

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private apiService: ApiService,
    private userService: UserService
  ) {
    super();
  }

  /**
   * Find list of all my teams.
   */
  private fetchTeams(args: FetchInput): Observable<TeamListResponse> {
    const url = ['team'].join('/');
    return this.apiService.get<TeamListResponse>(url).pipe(
      map((doc: TeamListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._teamsCache)) {
          return doc;
        }
        const activeRoles = [
          ETeamRole.Member,
          ETeamRole.Admin,
          ETeamRole.Owner
        ];
        this._teams = doc.filter((v) => activeRoles.includes(v.role));
        this._teamsSubject.next(this._teams);
        this._teamsCache = doc;
        return doc;
      })
    );
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
      onetime.push(this.fetchTeams(args));
    }
    if (!this._team) {
      onetime.push(this.fetchTeam(args));
    }
    if (!this._members || args.currentTab === TeamPageTabType.Members) {
      onetime.push(this.fetchMembers(args));
    }
    if (!this._items || args.currentTab === TeamPageTabType.Suites) {
      onetime.push(this.fetchSuites(args));
    }

    forkJoin(onetime).subscribe(
      () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound
        );
      },
      (err) => {
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
    );
  }

  /**
   * Updates new information to all components of the team page in the event
   * that the team slug changes during the lifetime of this page.
   *
   * Team slug may change in two cases:
   *  - User switches to another team
   *  - User updates slug of this team
   */
  public updateTeamSlug(currentTab: TeamPageTabType, teamSlug: string): void {
    this._teams = null;
    this._team = null;
    this._members = null;
    this.fetchItems({ currentTab, teamSlug });
  }

  /**
   *
   */
  public refreshMembers(): void {
    this._members = null;
    this.fetchItems({
      currentTab: TeamPageTabType.Members,
      teamSlug: this._team.slug
    });
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
