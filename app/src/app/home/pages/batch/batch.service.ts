// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  BatchComparisonResponse,
  BatchListResponse,
  BatchLookupResponse,
  CommentItem,
  CommentListResponse,
  ServerEventJob,
  SuiteLookupResponse,
  TeamLookupResponse
} from '@touca/api-schema';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import type { FrontendBatchCompareParams } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { PageTab } from '@/home/components';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import { BatchPageItem, BatchPageOverviewMetadata } from './batch.model';

export type BatchPageTabType = 'elements';

const availableTabs: Record<BatchPageTabType, PageTab<BatchPageTabType>> = {
  elements: {
    type: 'elements',
    name: 'Testcases',
    link: 'testcases',
    icon: 'feather-list',
    shown: true
  }
};

@Injectable()
export class BatchPageService extends IPageService<BatchPageItem> {
  private cache: Partial<{
    batch: BatchLookupResponse;
    batchCompare: BatchComparisonResponse;
    batches: BatchListResponse;
    comments: Array<CommentItem>;
    overview: BatchPageOverviewMetadata;
    params: FrontendBatchCompareParams;
    suite: SuiteLookupResponse;
    tab: BatchPageTabType;
    tabs: Array<PageTab<BatchPageTabType>>;
    team: TeamLookupResponse;
  }> = {};

  private subjects = {
    batch: new Subject<BatchLookupResponse>(),
    batches: new Subject<BatchListResponse>(),
    comments: new Subject<Array<CommentItem>>(),
    overview: new Subject<BatchPageOverviewMetadata>(),
    params: new Subject<FrontendBatchCompareParams>(),
    suite: new Subject<SuiteLookupResponse>(),
    tab: new Subject<BatchPageTabType>(),
    tabs: new Subject<Array<PageTab<BatchPageTabType>>>(),
    team: new Subject<TeamLookupResponse>()
  };

  data = {
    batch$: this.subjects.batch.asObservable(),
    batches$: this.subjects.batches.asObservable(),
    comments$: this.subjects.comments.asObservable(),
    overview$: this.subjects.overview.asObservable(),
    params$: this.subjects.params.asObservable(),
    suite$: this.subjects.suite.asObservable(),
    tab$: this.subjects.tab.asObservable(),
    tabs$: this.subjects.tabs.asObservable(),
    team$: this.subjects.team.asObservable()
  };

  constructor(
    private alertService: AlertService,
    private apiService: ApiService
  ) {
    super();
  }

  consumeEvent(job: ServerEventJob) {
    if (
      this.cache.tab === 'elements' &&
      ['message:created', 'message:compared', 'batch:sealed'].includes(job.type)
    ) {
      this.cache.batchCompare = null;
      this.fetchItems(this.cache.params);
    }
  }

  private update = (key: string, response: unknown) => {
    if (response && !isEqual(response, this.cache[key])) {
      this.cache[key] = response;
      (this.subjects[key] as Subject<unknown>).next(response);
    }
  };

  private prepareTabs() {
    const tabs: PageTab<BatchPageTabType>[] = [availableTabs.elements];
    this.update('tabs', tabs);
  }

  /** Learn more about this team. */
  private fetchTeam(
    args: FrontendBatchCompareParams
  ): Observable<TeamLookupResponse> {
    const url = ['team', args.teamSlug].join('/');
    return this.apiService.get<TeamLookupResponse>(url).pipe(
      map((doc: TeamLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.team)) {
          return doc;
        }
        this.cache.team = doc;
        this.subjects.team.next(this.cache.team);
        return doc;
      })
    );
  }

  /** Learn more about this suite. */
  private fetchSuite(
    args: FrontendBatchCompareParams
  ): Observable<SuiteLookupResponse> {
    const url = ['suite', args.teamSlug, args.srcSuiteSlug].join('/');
    return this.apiService.get<SuiteLookupResponse>(url).pipe(
      map((doc: SuiteLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.suite)) {
          return doc;
        }
        this.cache.suite = doc;
        this.subjects.suite.next(this.cache.suite);
        return doc;
      })
    );
  }

  /** Find list of all batches in this suite. */
  private fetchBatches(
    args: FrontendBatchCompareParams
  ): Observable<BatchListResponse> {
    const url = ['batch', args.teamSlug, args.srcSuiteSlug].join('/');
    return this.apiService.get<BatchListResponse>(url).pipe(
      map((doc: BatchListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.batches)) {
          return doc;
        }
        this.cache.batches = doc;
        this.subjects.batches.next(this.cache.batches);
        return doc;
      })
    );
  }

  /** Learn more about this batch. */
  private fetchBatch(
    args: FrontendBatchCompareParams
  ): Observable<BatchLookupResponse> {
    const url = [
      'batch',
      args.teamSlug,
      args.srcSuiteSlug,
      args.srcBatchSlug
    ].join('/');
    return this.apiService.get<BatchLookupResponse>(url).pipe(
      map((doc: BatchLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.batch)) {
          return doc;
        }
        this.cache.batch = doc;
        this.subjects.batch.next(this.cache.batch);
        return doc;
      })
    );
  }

  /** Compare this batch against another batch. */
  private fetchBatchCompare(
    args: FrontendBatchCompareParams
  ): Observable<BatchComparisonResponse> {
    const url = [
      'batch',
      args.teamSlug,
      args.srcSuiteSlug,
      args.srcBatchSlug,
      'compare',
      args.dstBatchSlug,
      args.dstSuiteSlug
    ].join('/');
    return this.apiService.get<BatchComparisonResponse>(url).pipe(
      map((doc: BatchComparisonResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.batchCompare)) {
          return doc;
        }
        this.cache.batchCompare = doc;
        return doc;
      })
    );
  }

  private fetchComments(
    args: FrontendBatchCompareParams
  ): Observable<CommentListResponse> {
    const url = [
      'comment',
      args.teamSlug,
      args.srcSuiteSlug,
      args.srcBatchSlug,
      'c'
    ].join('/');
    return this.apiService.get<CommentListResponse>(url).pipe(
      map((doc: CommentListResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this.cache.comments)) {
          return doc;
        }
        this.cache.comments = doc;
        this.subjects.comments.next(this.cache.comments);
      })
    );
  }

  public fetchItems(args: FrontendBatchCompareParams): void {
    this.fetchBatchCompare(args).subscribe({
      next: (doc: BatchComparisonResponse) => {
        if (!doc || !this.cache.batch) {
          return;
        }
        const items = [
          ...doc.common.map((el) => new BatchPageItem(el, 'common')),
          ...doc.fresh.map((el) => new BatchPageItem(el, 'fresh')),
          ...doc.missing.map((el) => new BatchPageItem(el, 'missing'))
        ];
        this._items = items;
        this._itemsSubject.next(items);

        this.cache.overview = {
          ...doc.overview,
          batchIsSealed: this.cache.batch.isSealed,
          batchSubmittedAt: this.cache.batch.submittedAt as unknown as Date,
          batchSubmittedBy: this.cache.batch.submittedBy
        };
        this.subjects.overview.next(this.cache.overview);
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
          this.alertService.set(AlertKind.BatchNotFound);
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  public updateCurrentTab(tab: BatchPageTabType) {
    this.cache.tab = tab;
    this.subjects.tab.next(tab);
  }

  public updateRequestParams(params: FrontendBatchCompareParams) {
    const onetime: Observable<unknown>[] = [of(0)];

    if (!this.cache.team) {
      onetime.push(this.fetchTeam(params));
    }
    if (!this.cache.suite) {
      onetime.push(this.fetchSuite(params));
    }
    if (!this.cache.batches) {
      onetime.push(this.fetchBatches(params));
    }
    if (!this.cache.batch) {
      onetime.push(this.fetchBatch(params));
    }
    if (!this.cache.comments) {
      onetime.push(this.fetchComments(params));
    }

    forkJoin(onetime).subscribe({
      next: () => {
        this.prepareTabs();
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
          params.dstBatchSlug = this.cache.batch.comparedAgainst;
        }
        if (!isEqual(params, this.cache.params)) {
          this.cache.params = params;
          this.subjects.params.next(this.cache.params);
        }
        if (!this._items || params.currentTab === 'elements') {
          this.fetchItems(params);
        }
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
          this.alertService.set(AlertKind.BatchNotFound);
        } else {
          errorLogger.notify(err);
        }
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
    const params = this.cache.params;
    this.cache.batch = null;
    this.cache.comments = null;
    this.cache.params = null;
    params.srcBatchSlug = batchSlug;
    this.updateRequestParams(params);
  }

  public removeCacheBatch() {
    this.cache.batch = null;
  }

  public removeCacheSuiteAndBatches() {
    this.cache.suite = null;
    this.cache.batches = null;
    this.cache.batch = null;
  }

  public refetchBatch() {
    this.fetchBatch(this.cache.params).subscribe();
  }

  public refetchComments() {
    this.fetchComments(this.cache.params).subscribe();
  }
}
