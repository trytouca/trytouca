/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import type {
  BatchListResponse,
  SuiteItem,
  SuiteListResponse,
  SuiteLookupResponse,
  TeamLookupResponse
} from '@weasel/core/models/commontypes';
import { FrontendBatchItem } from '@weasel/core/models/frontendtypes';
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

import { SuitePageItem, SuitePageItemType } from './suite.model';

export enum SuitePageTabType {
  Versions = 'versions',
  Trends = 'trends',
  Settings = 'settings'
}

type FetchInput = {
  currentTab: string;
  teamSlug: string;
  suiteSlug: string;
};

@Injectable()
export class SuitePageService extends IPageService<SuitePageItem> {
  private _team: TeamLookupResponse;
  private _teamSubject = new Subject<TeamLookupResponse>();
  team$ = this._teamSubject.asObservable();

  private _suites: SuiteItem[];
  private _suitesSubject = new Subject<SuiteItem[]>();
  suites$ = this._suitesSubject.asObservable();

  private _suite: SuiteLookupResponse;
  private _suiteSubject = new Subject<SuiteLookupResponse>();
  suite$ = this._suiteSubject.asObservable();

  private _batches: BatchListResponse;
  private _batchesSubject = new Subject<BatchListResponse>();
  batches$ = this._batchesSubject.asObservable();

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
   * Learn more about this team.
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
        return doc;
      })
    );
  }

  /**
   * Find list of all suites in this team.
   */
  private fetchSuites(args: FetchInput): Observable<SuiteListResponse> {
    const url = ['suite', args.teamSlug].join('/');
    return this.apiService.get<SuiteListResponse>(url).pipe(
      map((doc: SuiteListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._suites)) {
          return doc;
        }
        this._suites = doc;
        this._suitesSubject.next(this._suites);
        return doc;
      })
    );
  }

  /**
   * Learn more about this suite.
   */
  private fetchSuite(args: FetchInput): Observable<SuiteLookupResponse> {
    const url = ['suite', args.teamSlug, args.suiteSlug].join('/');
    return this.apiService.get<SuiteLookupResponse>(url).pipe(
      map((doc: SuiteLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._suite)) {
          return doc;
        }
        this._suite = doc;
        this._suiteSubject.next(this._suite);
        return doc;
      })
    );
  }

  /**
   * Find list of all batches in this suite.
   */
  private fetchBatches(args: FetchInput): Observable<BatchListResponse> {
    const url = ['batch', args.teamSlug, args.suiteSlug].join('/');
    return this.apiService.get<BatchListResponse>(url).pipe(
      map((doc: BatchListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._batches)) {
          return doc;
        }
        this._batches = doc;
        this._batchesSubject.next(this._batches);
        return doc;
      })
    );
  }

  /**
   *
   */
  public fetchItems(args: FetchInput): void {
    const onetime: Observable<unknown>[] = [of(0)];

    if (!this._team) {
      onetime.push(this.fetchTeam(args));
    }
    if (!this._suites) {
      onetime.push(this.fetchSuites(args));
    }
    if (!this._suite) {
      onetime.push(this.fetchSuite(args));
    }
    if (!this._batches || args.currentTab === SuitePageTabType.Versions) {
      onetime.push(this.fetchBatches(args));
    }

    forkJoin(onetime).subscribe(
      () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound,
          AlertKind.SuiteNotFound
        );
        const batches = this._batches.map((v) => {
          const batch = v as FrontendBatchItem;
          batch.isBaseline =
            batch.batchSlug === this._suite.baseline?.batchSlug;
          return new SuitePageItem(batch, SuitePageItemType.Batch);
        });
        const promotions = this._suite.promotions.map((v) => {
          const bySelf =
            this.userService.currentUser.username === v.by.username;
          return new SuitePageItem(
            { ...v, bySelf },
            SuitePageItemType.Promotion
          );
        });
        // since first batch of the suite is always the baseline, remove its
        // corresponding promotion entry because it has no value for the user.
        promotions.shift();
        const items = [...batches, ...promotions].sort(
          SuitePageItem.compareByDate
        );
        if (isEqual(this._items, items)) {
          return;
        }
        this._items = items;
        this._itemsSubject.next(this._items);
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
          this.alertService.set(AlertKind.SuiteNotFound);
        } else {
          errorLogger.notify(err);
        }
      }
    );
  }

  /**
   * Updates new information to all components of the suite page in the event
   * that the suite slug changes during the lifetime of this page.
   *
   * Team slug may change in two cases:
   *  - User switches to another suite
   *  - User updates slug of this suite
   */
  public updateSuiteSlug(
    currentTab: SuitePageTabType,
    suiteSlug: string
  ): void {
    const teamSlug = this._suite.teamSlug;
    this._suites = null;
    this._suite = null;
    this._batches = null;
    this.fetchItems({ currentTab, teamSlug, suiteSlug });
  }

  /**
   *
   */
  public updateSubscription(
    action: 'subscribe' | 'unsubscribe'
  ): Observable<void> {
    const url = [
      'suite',
      this._suite.teamSlug,
      this._suite.suiteSlug,
      action
    ].join('/');
    return this.apiService.post(url);
  }
}
