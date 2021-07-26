/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import type {
  BatchLookupResponse,
  ElementComparisonResponse,
  ElementLookupResponse,
  SuiteLookupResponse
} from '@/core/models/commontypes';
import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import {
  ElementPageItemType,
  ElementPageMetric,
  ElementPageOverviewMetadata,
  ElementPageResult
} from './element.model';

export enum ElementPageTabType {
  Results = 'results',
  Metrics = 'metrics'
}

type FetchInput = FrontendElementCompareParams;

@Injectable()
export class ElementPageService extends IPageService<ElementPageResult> {
  private _suite: SuiteLookupResponse;
  private _suiteSubject = new Subject<SuiteLookupResponse>();
  suite$ = this._suiteSubject.asObservable();

  private _batch: BatchLookupResponse;
  private _batchSubject = new Subject<BatchLookupResponse>();
  batch$ = this._batchSubject.asObservable();

  private _element: ElementLookupResponse;
  private _elementSubject = new Subject<ElementLookupResponse>();
  element$ = this._elementSubject.asObservable();

  private _params: FrontendElementCompareParams;
  private _paramsSubject = new Subject<FrontendElementCompareParams>();
  params$ = this._paramsSubject.asObservable();

  private _overview: ElementPageOverviewMetadata;
  private _overviewSubject = new Subject<ElementPageOverviewMetadata>();
  overview$ = this._overviewSubject.asObservable();

  private _elementCompareCache: ElementComparisonResponse;

  private _allMetricsSubject = new Subject<ElementPageMetric[]>();
  allMetricKeys$ = this._allMetricsSubject.asObservable();

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
   * Learn more about this suite.
   */
  private fetchSuite(args: FetchInput): Observable<SuiteLookupResponse> {
    const url = ['suite', args.teamSlug, args.srcSuiteSlug].join('/');
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
   * Learn more about this batch.
   */
  private fetchBatch(args: FetchInput): Observable<BatchLookupResponse> {
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
        if (isEqual(doc, this._batch)) {
          return doc;
        }
        this._batch = doc;
        this._batchSubject.next(this._batch);
        return doc;
      })
    );
  }

  /**
   * Learn more about this element.
   */
  private fetchElement(args: FetchInput): Observable<ElementLookupResponse> {
    const url = [
      'element',
      args.teamSlug,
      args.srcSuiteSlug,
      args.srcElementSlug
    ].join('/');
    return this.apiService.get<ElementLookupResponse>(url).pipe(
      map((doc: ElementLookupResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._element)) {
          return doc;
        }
        this._element = doc;
        this._elementSubject.next(this._element);
        return doc;
      })
    );
  }

  /**
   * Learn more about this element.
   */
  private fetchElementCompare(
    args: FetchInput
  ): Observable<ElementComparisonResponse> {
    const url = [
      'element',
      args.teamSlug,
      args.srcSuiteSlug,
      args.srcElementSlug,
      'compare',
      args.srcBatchSlug,
      args.dstBatchSlug,
      args.dstElementSlug,
      args.dstSuiteSlug
    ].join('/');
    return this.apiService.get<ElementComparisonResponse>(url).pipe(
      map((doc: ElementComparisonResponse) => {
        if (!doc) {
          return;
        }
        if (isEqual(doc, this._elementCompareCache)) {
          return doc;
        }
        this._elementCompareCache = doc;
        return doc;
      })
    );
  }

  /**
   *
   */
  public fetchItems(args: FrontendElementCompareParams): void {
    this.fetchElementCompare(args).subscribe({
      next: (doc: ElementComparisonResponse) => {
        // if comparison result is not available, we have no choice but to wait
        if (!doc.cmp) {
          return;
        }

        const results = doc.cmp.results;
        const commonResults = results.commonKeys.map(
          (el) => new ElementPageResult(el, ElementPageItemType.Common)
        );
        const freshResults = results.newKeys.map(
          (el) => new ElementPageResult(el, ElementPageItemType.Fresh)
        );
        const missingResults = results.missingKeys.map(
          (el) => new ElementPageResult(el, ElementPageItemType.Missing)
        );
        const items = [...commonResults, ...freshResults, ...missingResults];
        this._items = items;
        this._itemsSubject.next(items);

        const metrics = doc.cmp.metrics;
        const commonMetrics = metrics.commonKeys.map(
          (el) => new ElementPageMetric(el, ElementPageItemType.Common)
        );
        const freshMetrics = metrics.newKeys.map(
          (el) => new ElementPageMetric(el, ElementPageItemType.Fresh)
        );
        const missingMetrics = metrics.missingKeys.map(
          (el) => new ElementPageMetric(el, ElementPageItemType.Missing)
        );
        const itemsM = [...commonMetrics, ...freshMetrics, ...missingMetrics];
        this._allMetricsSubject.next(itemsM);

        const countDst = commonResults.length + missingResults.length;
        const countPerfect = commonResults.reduce(
          (acc, key) => (key.data.score === 1.0 ? acc + 1 : acc),
          0
        );

        const durationCommonSrc = commonMetrics.reduce(
          (acc, key) => acc + key.data.src,
          0
        );
        const durationCommonDst = commonMetrics.reduce(
          (acc, key) => acc + key.data.dst,
          0
        );
        const durationFresh = freshMetrics.reduce(
          (acc, key) => acc + key.data.duration(),
          0
        );
        const durationMissing = missingMetrics.reduce(
          (acc, key) => acc + key.data.duration(),
          0
        );
        const durationDst = durationCommonDst + durationMissing;
        const durationSrc = durationCommonSrc + durationFresh;

        this._overview = {
          messageSubmittedAt: doc.src.submittedAt,
          messageSubmittedBy: doc.src.submittedBy,
          messageBuiltAt: doc.src.builtAt,
          resultsCountHead: commonResults.length + freshResults.length,
          resultsCountFresh: freshResults.length,
          resultsCountMissing: missingResults.length,
          resultsCountDifferent: countDst - countPerfect,
          resultsScore: countDst === 0 ? 1 : countPerfect / countDst,
          metricsCountHead: commonMetrics.length + freshMetrics.length,
          metricsCountFresh: freshMetrics.length,
          metricsCountMissing: missingMetrics.length,
          metricsDurationHead: durationSrc,
          metricsDurationChange: Math.abs(durationSrc - durationDst),
          metricsDurationSign: Math.sign(durationSrc - durationDst)
        };
        this._overviewSubject.next(this._overview);
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
   *
   */
  public updateRequestParams(params: FrontendElementCompareParams) {
    const onetime: Observable<unknown>[] = [of(0)];

    if (!this._suite) {
      onetime.push(this.fetchSuite(params));
    }
    if (!this._batch) {
      onetime.push(this.fetchBatch(params));
    }
    if (!this._element) {
      onetime.push(this.fetchElement(params));
    }

    forkJoin(onetime).subscribe({
      next: () => {
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.SuiteNotFound,
          AlertKind.BatchNotFound,
          AlertKind.ElementNotFound
        );
        if (!params.dstSuiteSlug) {
          params.dstSuiteSlug = params.srcSuiteSlug;
        }
        if (!params.dstBatchSlug) {
          const baseline = this._suite.promotions.slice(-1)[0];
          params.dstBatchSlug =
            baseline.to === this._batch.batchSlug ? baseline.from : baseline.to;
        }
        if (!params.dstElementSlug) {
          params.dstElementSlug = params.srcElementSlug;
        }
        if (!isEqual(params, this._params)) {
          this._params = params;
          this._paramsSubject.next(this._params);
        }
        this.fetchItems(params);
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
          this.alertService.set(AlertKind.ElementNotFound);
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  /**
   * Reset all member variables **except** for the suite.
   * This is function is meant to be called when user is switching head or
   * base versions.
   */
  public resetCache() {
    this._batch = undefined;
    this._element = undefined;
    this._params = undefined;
    this._overview = undefined;
    this._elementCompareCache = undefined;
    this._items = undefined;
  }
}
