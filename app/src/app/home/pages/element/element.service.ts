// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  BatchLookupResponse,
  ElementComparisonResponse,
  ElementLookupResponse,
  SuiteLookupResponse
} from '@touca/api-schema';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import {
  ElementPageMetric,
  ElementPageOverviewMetadata,
  ElementPageResult
} from './element.model';

type FetchInput = FrontendElementCompareParams;

@Injectable()
export class ElementPageService extends IPageService<ElementPageResult> {
  private cache: Partial<{
    batch: BatchLookupResponse;
    compare: ElementComparisonResponse;
    element: ElementLookupResponse;
    overview: ElementPageOverviewMetadata;
    params: FrontendElementCompareParams;
    suite: SuiteLookupResponse;
  }> = {};

  private subjects = {
    allMetrics: new Subject<Array<ElementPageMetric>>(),
    batch: new Subject<BatchLookupResponse>(),
    element: new Subject<ElementLookupResponse>(),
    overview: new Subject<ElementPageOverviewMetadata>(),
    params: new Subject<FrontendElementCompareParams>(),
    suite: new Subject<SuiteLookupResponse>()
  };

  data = {
    allMetrics$: this.subjects.allMetrics.asObservable(),
    batch$: this.subjects.batch.asObservable(),
    element$: this.subjects.element.asObservable(),
    overview$: this.subjects.overview.asObservable(),
    params$: this.subjects.params.asObservable(),
    suite$: this.subjects.suite.asObservable()
  };

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
        if (isEqual(doc, this.cache.suite)) {
          return doc;
        }
        this.cache.suite = doc;
        this.subjects.suite.next(doc);
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
        if (isEqual(doc, this.cache.batch)) {
          return doc;
        }
        this.cache.batch = doc;
        this.subjects.batch.next(doc);
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
        if (isEqual(doc, this.cache.element)) {
          return doc;
        }
        this.cache.element = doc;
        this.subjects.element.next(doc);
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
        if (isEqual(doc, this.cache.compare)) {
          return doc;
        }
        this.cache.compare = doc;
        return doc;
      })
    );
  }

  public fetchItems(args: FrontendElementCompareParams): void {
    this.fetchElementCompare(args).subscribe({
      next: (doc: ElementComparisonResponse) => {
        // if comparison result is not available, we have no choice but to wait
        if (!doc.cmp) {
          return;
        }

        const results = doc.cmp.results;
        const commonResults = results.commonKeys.map(
          (el) => new ElementPageResult(el, 'common')
        );
        const freshResults = results.newKeys.map(
          (el) => new ElementPageResult(el, 'fresh')
        );
        const missingResults = results.missingKeys.map(
          (el) => new ElementPageResult(el, 'missing')
        );
        const items = [...commonResults, ...freshResults, ...missingResults];
        this._items = items;
        this._itemsSubject.next(items);

        const metrics = doc.cmp.metrics;
        const commonMetrics = metrics.commonKeys.map(
          (el) => new ElementPageMetric(el, 'common')
        );
        const freshMetrics = metrics.newKeys.map(
          (el) => new ElementPageMetric(el, 'fresh')
        );
        const missingMetrics = metrics.missingKeys.map(
          (el) => new ElementPageMetric(el, 'missing')
        );
        const itemsM = [...commonMetrics, ...freshMetrics, ...missingMetrics];
        this.subjects.allMetrics.next(itemsM);

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

        this.cache.overview = {
          messageSubmittedAt: doc.src.submittedAt as unknown as Date,
          messageSubmittedBy: doc.src.submittedBy,
          messageBuiltAt: doc.src.builtAt as unknown as Date,
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

  public updateRequestParams(params: FrontendElementCompareParams) {
    const onetime: Observable<unknown>[] = [of(0)];

    if (!this.cache.suite) {
      onetime.push(this.fetchSuite(params));
    }
    if (!this.cache.batch) {
      onetime.push(this.fetchBatch(params));
    }
    if (!this.cache.element) {
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
          const baseline = this.cache.suite.promotions.slice(-1)[0];
          params.dstBatchSlug =
            baseline.to === this.cache.batch.batchSlug
              ? baseline.from
              : baseline.to;
        }
        if (!params.dstElementSlug) {
          params.dstElementSlug = params.srcElementSlug;
        }
        params.dstBatchName = params.dstBatchSlug.split('@')[0];
        params.srcBatchName = params.srcBatchSlug.split('@')[0];
        if (!isEqual(params, this.cache.params)) {
          this.cache.params = params;
          this.subjects.params.next(this.cache.params);
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
    this.cache.batch = undefined;
    this.cache.compare = undefined;
    this.cache.element = undefined;
    this.cache.overview = undefined;
    this.cache.params = undefined;
    this._items = undefined;
  }

  public getImagePath(side: 'src' | 'dst', name: string) {
    const path =
      side === 'src'
        ? [
            'element',
            this.cache.params.teamSlug,
            this.cache.params.srcSuiteSlug,
            this.cache.params.srcElementSlug,
            'artifact',
            this.cache.params.srcBatchSlug,
            name
          ].join('/')
        : [
            'element',
            this.cache.params.teamSlug,
            this.cache.params.dstSuiteSlug,
            this.cache.params.dstElementSlug,
            'artifact',
            this.cache.params.dstBatchSlug,
            name
          ].join('/');
    return this.apiService.makeUrl(path);
  }
}
