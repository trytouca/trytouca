/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ETeamRole, TeamListResponse } from '@/core/models/commontypes';
import { ELocalStorageKey } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import { TeamsPageItemType, TeamsPageTeam } from './teams.model';

type FetchInput = Record<string, never>;

@Injectable()
export class TeamsPageService extends IPageService<TeamsPageTeam> {
  private _itemsCache: TeamListResponse;

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
   *
   * For better user experience, we like to memorize the last team user
   * has interacted with, so that when they navigate to other parts of
   * the web app, they can skip the "team list" page. To do so we
   * use local storage (if it is enabled).
   * But if the user manually navigates to this page, we like to remove
   * the last visited page for continuity of their workflow.
   */
  private fetchTeams(args: FetchInput): Observable<TeamListResponse> {
    const url = ['team'].join('/');
    return this.apiService.get<TeamListResponse>(url).pipe(
      map((doc: TeamListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._itemsCache)) {
          return doc;
        }
        const activeRoles = [
          ETeamRole.Member,
          ETeamRole.Admin,
          ETeamRole.Owner
        ];
        const active = doc
          .filter((v) => activeRoles.includes(v.role))
          .map((v) => new TeamsPageTeam(v, TeamsPageItemType.Active));
        const joining = doc
          .filter((v) => v.role === ETeamRole.Applicant)
          .map((v) => new TeamsPageTeam(v, TeamsPageItemType.Joining));
        const invited = doc
          .filter((v) => v.role === ETeamRole.Invited)
          .map((v) => new TeamsPageTeam(v, TeamsPageItemType.Invited));

        this._items = [...active, ...joining, ...invited];
        this._itemsSubject.next(this._items);
        this._itemsCache = doc;

        localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
        return doc;
      })
    );
  }

  /**
   *
   */
  public fetchItems(args: FetchInput): void {
    const observables = [this.fetchTeams(args)];
    forkJoin(observables).subscribe({
      next: () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost
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
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  /**
   *
   */
  refreshList() {
    this._itemsCache = undefined;
    this.fetchItems({});
  }
}
