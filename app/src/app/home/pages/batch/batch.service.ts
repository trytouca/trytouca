/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Injectable } from '@angular/core';
import { isEqual } from 'lodash-es';
import { of, Observable, Subject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  BatchListResponse, BatchLookupResponse, BatchComparisonResponse,
  CommentItem, CommentListResponse, SuiteLookupResponse, TeamLookupResponse } from 'src/app/core/models/commontypes';
import type { FrontendBatchCompareParams } from 'src/app/core/models/frontendtypes';
import { AlertService, AlertKind, ApiService } from 'src/app/core/services';
import { errorLogger } from 'src/app/shared/utils/errorLogger';
import { IPageService } from 'src/app/home/models/pages.model';
import { BatchPageItem, BatchPageItemType, BatchPageOverviewMetadata } from './batch.model';

export enum BatchPageTabType {
  Comments = 'comments',
  Elements = 'elements'
}

@Injectable()
export class BatchPageService extends IPageService<BatchPageItem> {

  private _team: TeamLookupResponse;
  private _teamSubject = new Subject<TeamLookupResponse>();
  team$ = this._teamSubject.asObservable();

  private _suite: SuiteLookupResponse;
  private _suiteSubject = new Subject<SuiteLookupResponse>();
  suite$ = this._suiteSubject.asObservable();

  private _batches: BatchListResponse;
  private _batchesSubject = new Subject<BatchListResponse>();
  batches$ = this._batchesSubject.asObservable();

  private _batch: BatchLookupResponse;
  private _batchSubject = new Subject<BatchLookupResponse>();
  batch$ = this._batchSubject.asObservable();

  private _params: FrontendBatchCompareParams;
  private _paramsSubject = new Subject<FrontendBatchCompareParams>();
  params$ = this._paramsSubject.asObservable();

  private _overview: BatchPageOverviewMetadata;
  private _overviewSubject = new Subject<BatchPageOverviewMetadata>();
  overview$ = this._overviewSubject.asObservable();

  private _batchCompareCache: BatchComparisonResponse;

  private _comments: CommentItem[];
  private _commentsSubject = new Subject<CommentItem[]>();
  comments$ = this._commentsSubject.asObservable();

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
   * Learn more about this team.
   */
  private fetchTeam(args: FrontendBatchCompareParams): Observable<TeamLookupResponse> {
    const url = [ 'team', args.teamSlug ].join('/');
    return this.apiService.get<TeamLookupResponse>(url).pipe(map(
      (doc: TeamLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._team)) {
          return doc;
        }
        this._team = doc;
        this._teamSubject.next(this._team);
        return doc;
      }
    ));
  }

  /**
   * Learn more about this suite.
   */
  private fetchSuite(args: FrontendBatchCompareParams): Observable<SuiteLookupResponse> {
    const url = [ 'suite', args.teamSlug, args.srcSuiteSlug ].join('/');
    return this.apiService.get<SuiteLookupResponse>(url).pipe(map(
      (doc: SuiteLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._suite)) {
          return doc;
        }
        this._suite = doc;
        this._suiteSubject.next(this._suite);
        return doc;
      }
    ));
  }

  /**
   * Find list of all batches in this suite.
   */
  private fetchBatches(args: FrontendBatchCompareParams): Observable<BatchListResponse> {
    const url = [ 'batch', args.teamSlug, args.srcSuiteSlug ].join('/');
    return this.apiService.get<BatchListResponse>(url).pipe(map(
      (doc: BatchListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._batches)) {
          return doc;
        }
        this._batches = doc;
        this._batchesSubject.next(this._batches);
        return doc;
      }
    ));
  }

  /**
   * Learn more about this batch.
   */
  private fetchBatch(args: FrontendBatchCompareParams): Observable<BatchLookupResponse> {
    const url = [ 'batch', args.teamSlug, args.srcSuiteSlug, args.srcBatchSlug ].join('/');
    return this.apiService.get<BatchLookupResponse>(url).pipe(map(
      (doc: BatchLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._batch)) {
          return doc;
        }
        this._batch = doc;
        this._batchSubject.next(this._batch);
        return doc;
      }
    ));
  }

  /**
   * Compare this batch against another batch.
   */
  private fetchBatchCompare(args: FrontendBatchCompareParams): Observable<BatchComparisonResponse> {
    const url = [ 'batch', args.teamSlug, args.srcSuiteSlug, args.srcBatchSlug,
      'compare', args.dstBatchSlug, args.dstSuiteSlug
    ].join('/');
    return this.apiService.get<BatchComparisonResponse>(url).pipe(map(
      (doc: BatchComparisonResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._batchCompareCache)) {
          return doc;
        }
        this._batchCompareCache = doc;
        return doc;
      }
    ));
  }

  /**
   *
   */
  private fetchComments(args: FrontendBatchCompareParams): Observable<CommentListResponse> {
    const url = [ 'comment', args.teamSlug, args.srcSuiteSlug, args.srcBatchSlug, 'c' ].join('/');
    return this.apiService.get<CommentListResponse>(url).pipe(map(
      (doc: CommentListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._comments)) {
          return doc;
        }
        this._comments = doc;
        this._commentsSubject.next(this._comments);
      }
    ));
  }

  /**
   *
   */
  public fetchItems(args: FrontendBatchCompareParams): void {
    this.fetchBatchCompare(args).subscribe(
      (doc: BatchComparisonResponse) => {
        if (!doc || !this._batch) {
          return;
        }
        const common = doc.common.map(el => new BatchPageItem(el, BatchPageItemType.Common));
        const fresh = doc.fresh.map(el => new BatchPageItem(el, BatchPageItemType.Fresh));
        const missing = doc.missing.map(el => new BatchPageItem(el, BatchPageItemType.Missing));
        const items = [ ...common, ...fresh, ...missing ];
        this._items = items;
        this._itemsSubject.next(items);

        this._overview = {
          ...doc.overview,
          batchIsSealed: this._batch.isSealed,
          batchSubmittedAt: this._batch.submittedAt,
          batchSubmittedBy: this._batch.submittedBy
        };
        this._overviewSubject.next(this._overview);
      },
      err => {
        if (err.status === 0) {
          this.alertService.set(!this._items ? AlertKind.ApiConnectionDown : AlertKind.ApiConnectionLost);
        } else if (err.status === 401) {
          this.alertService.set(AlertKind.InvalidAuthToken);
        } else if (err.status === 404) {
          this.alertService.set(AlertKind.BatchNotFound);
        } else {
          errorLogger.notify(err);
        }
      });
  }

  /**
   *
   */
  public updateRequestParams(params: FrontendBatchCompareParams) {
    const onetime: Observable<unknown>[] = [ of(0) ];

    if (!this._team) {
      onetime.push(this.fetchTeam(params));
    }
    if (!this._suite) {
      onetime.push(this.fetchSuite(params));
    }
    if (!this._batches) {
      onetime.push(this.fetchBatches(params));
    }
    if (!this._batch) {
      onetime.push(this.fetchBatch(params));
    }
    if (!this._comments || params.currentTab === BatchPageTabType.Comments) {
      onetime.push(this.fetchComments(params));
    }

    forkJoin(onetime).subscribe(
      () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound,
          AlertKind.SuiteNotFound,
          AlertKind.BatchNotFound
        );
        if (!params.dstSuiteSlug) {
          params.dstSuiteSlug = params.srcSuiteSlug;
        }
        if (!params.dstBatchSlug) {
          params.dstBatchSlug = this._batch.comparedAgainst;
        }
        if (!isEqual(params, this._params)) {
          this._params = params;
          this._paramsSubject.next(this._params);
        }
        if (!this._items || params.currentTab === BatchPageTabType.Elements) {
          this.fetchItems(params);
        }
      },
      err => {
        if (err.status === 0) {
          this.alertService.set(!this._items ? AlertKind.ApiConnectionDown : AlertKind.ApiConnectionLost);
        } else if (err.status === 401) {
          this.alertService.set(AlertKind.InvalidAuthToken);
        } else if (err.status === 404) {
          this.alertService.set(AlertKind.BatchNotFound);
        } else {
          errorLogger.notify(err);
        }
      });
  }

  /**
   * Updates new information to all components of the batch page in the event
   * that the batch slug changes during the lifetime of this page.
   *
   * Batch slug may change in one case:
   *  - User switches to another batch
   */
  public updateBatchSlug(batchSlug: string): void {
    const params = this._params;
    this._batch = null;
    this._comments = null;
    this._params = null;
    params.srcBatchSlug = batchSlug;
    this.updateRequestParams(params);
  }

  /**
   *
   */
  public removeCacheBatch() {
    this._batch = null;
  }

  /**
   *
   */
  public removeCacheSuiteAndBatches() {
    this._suite = null;
    this._batches = null;
    this._batch = null;
  }

  /**
   *
   */
  public refetchBatch() {
    const args = { currentTab: BatchPageTabType.Comments, ...this._params };
    this.fetchBatch(args).subscribe();
  }

  /**
   *
   */
  public refetchComments() {
    const args = { currentTab: BatchPageTabType.Comments, ...this._params };
    this.fetchComments(args).subscribe();
  }

}
