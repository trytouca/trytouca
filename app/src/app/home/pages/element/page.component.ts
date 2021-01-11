/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { formatDate } from '@angular/common';
import { Component, Inject, LOCALE_ID, OnDestroy, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSpinner, faStopwatch, faTasks } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import type { ElementLookupResponse, SuiteLookupResponse, BatchLookupResponse } from '@weasel/core/models/commontypes';
import type { FrontendElementCompareParams, FrontendOverviewSection } from '@weasel/core/models/frontendtypes';
import { Alert, AlertKind, AlertService, AlertType } from '@weasel/core/services';
import { PageComponent, PageTab } from '@weasel/home/components/page.component';
import { ElementPageOverviewMetadata, ElementPageResult } from './element.model';
import { ElementPageService, ElementPageTabType } from './element.service';

const pageTabs: PageTab<ElementPageTabType>[] = [
  {
    type: ElementPageTabType.Results,
    name: 'Results',
    link: 'results',
    icon: 'tasks',
    shown: true
  },
  {
    type: ElementPageTabType.Metrics,
    name: 'Metrics',
    link: 'metrics',
    icon: 'stopwatch',
    shown: true
  }
];

type NotFound = Partial<{
  teamSlug: string
  suiteSlug: string
  batchSlug: string
  elementSlug: string
}>;

@Component({
  selector: 'app-element-page',
  templateUrl: './page.component.html',
  providers: [ ElementPageService, { provide: 'PAGE_TABS', useValue: pageTabs } ]
})
export class ElementPageComponent extends PageComponent<ElementPageResult, ElementPageTabType, NotFound> implements OnInit, OnDestroy {

  customAlert: Omit<Alert, 'kind'>;
  suite: SuiteLookupResponse;
  batch: BatchLookupResponse;
  element: ElementLookupResponse;
  overview: FrontendOverviewSection;
  params: FrontendElementCompareParams;
  TabType = ElementPageTabType;

  private _subSuite: Subscription;
  private _subBatch: Subscription;
  private _subElement: Subscription;
  private _subOverview: Subscription;
  private _subAlert: Subscription;
  private _subParams: Subscription;
  private _subParamMap: Subscription;
  private _subQueryParamMap: Subscription;

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private elementPageService: ElementPageService,
    private router: Router,
    private titleService: Title,
    private faIconLibrary: FaIconLibrary,
    route: ActivatedRoute,
    @Inject(LOCALE_ID) private locale: string
  ) {
    super(elementPageService, pageTabs, route);
    faIconLibrary.addIcons(faSpinner, faStopwatch, faTasks);
    this._subAlert = this.alertService.alerts$.subscribe(v => {
      if (v.some(k => k.kind === AlertKind.TeamNotFound)) {
        this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
      }
      if (v.some(k => k.kind === AlertKind.SuiteNotFound)) {
        this._notFound.suiteSlug = this.route.snapshot.paramMap.get('suite');
      }
      if (v.some(k => k.kind === AlertKind.BatchNotFound)) {
        this._notFound.batchSlug = this.route.snapshot.paramMap.get('batch');
      }
      if (v.some(k => k.kind === AlertKind.ElementNotFound)) {
        this._notFound.elementSlug = this.route.snapshot.paramMap.get('element');
      }
    });
    this._subSuite = this.elementPageService.suite$.subscribe(v => {
      this.suite = v;
    });
    this._subBatch = this.elementPageService.batch$.subscribe(v => {
      this.batch = v;
    });
    this._subElement = this.elementPageService.element$.subscribe(v => {
      this.element = v;
      this.updateTitle(v);
    });
    this._subOverview = this.elementPageService.overview$.subscribe(v => {
      this.tabs.find(t => t.type === ElementPageTabType.Results).counter = v.resultsCountHead;
      this.tabs.find(t => t.type === ElementPageTabType.Metrics).counter = v.metricsCountHead;
      this.overview = this.findOverviewInputs(v);
    });
    this._subParams = this.elementPageService.params$.subscribe(v => {
      this.params = v;
    });
    this._subParamMap = this.route.paramMap.subscribe(v => {
      // by ensuring that params is set, we avoid calling this function during
      // initial page load.
      if (this.params) {
        const params = this.params;
        params.teamSlug = v.get('team');
        params.srcSuiteSlug = v.get('suite');
        params.srcBatchSlug = v.get('batch');
        params.srcElementSlug = v.get('element');
        this.elementPageService.resetCache();
        this.elementPageService.updateRequestParams(params);
      }
    });
    this._subQueryParamMap = this.route.queryParamMap.subscribe(v => {
      if (this.params) {
        const params = this.params;
        const getQuery = (key: string) => v.has(key) ? v.get(key) : null;
        params.dstSuiteSlug = getQuery('cn');
        params.dstBatchSlug = getQuery('cv');
        params.dstElementSlug = getQuery('ct');
        this.elementPageService.resetCache();
        this.elementPageService.updateRequestParams(params);
      }
    });
  }

  /**
   *
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subSuite.unsubscribe();
    this._subBatch.unsubscribe();
    this._subElement.unsubscribe();
    this._subOverview.unsubscribe();
    this._subParams.unsubscribe();
    this._subAlert.unsubscribe();
    this._subParamMap.unsubscribe();
    this._subQueryParamMap.unsubscribe();
    super.ngOnDestroy();
  }

  /**
   *
   */
  fetchItems(): void {
    if (!this.params) {
      const queryMap = this.route.snapshot.queryParamMap;
      const paramMap = this.route.snapshot.paramMap;
      const getQuery = (key: string) => queryMap.has(key) ? queryMap.get(key) : null;
      this.params = {
        currentTab: this.currentTab,
        teamSlug: paramMap.get('team'),
        srcSuiteSlug: paramMap.get('suite'),
        srcBatchSlug: getQuery('v') || paramMap.get('batch'),
        srcElementSlug: paramMap.get('element'),
        dstSuiteSlug: getQuery('cn'),
        dstBatchSlug: getQuery('cv'),
        dstElementSlug: getQuery('ct')
      };
      this.setCustomAlerts();
    }
    this.elementPageService.updateRequestParams(this.params);
  }

  /**
   *
   */
  private setCustomAlerts() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('bv')) {
      this.customAlert = {
        type: AlertType.Info,
        message: `Element <b>${this.params.srcElementSlug}</b> is missing
          from version <b>${queryMap.get('bv')}</b>. You are viewing
          results for version <b>${this.params.dstBatchSlug || this.params.srcBatchSlug}</b>.`
      };
    }
    if (queryMap.has('bcv')) {
      this.customAlert = {
        type: AlertType.Info,
        message: `Element <b>${this.params.srcElementSlug}</b> is missing
          from version <b>${queryMap.get('bcv')}</b>. You are viewing
          results for version <b>${this.params.srcBatchSlug}</b>.`
      };
    }
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Backspace' should return user to "Batch" page
    if ('Backspace' === event.key) {
      const queryParams = this.findPreviousPageQueryParams();
      this.router.navigate(['..'], { queryParams, relativeTo: this.route });
    }
  }

  /**
   *
   */
  updateTitle(element: ElementLookupResponse) {
    const title = [ element.elementName, element.suiteName, element.teamName, 'Weasel' ].join(' - ');
    this.titleService.setTitle(title);
  }

  /**
   *
   */
  public findPreviousPageQueryParams() {
    const paramMap = this.route.snapshot.paramMap;
    const queryMap = this.route.snapshot.queryParamMap;
    const getParam = (key: string) => paramMap.has(key) ? paramMap.get(key) : null;
    const getQuery = (key: string) => queryMap.has(key) ? queryMap.get(key) : null;
    const queryParams = {
      cv: queryMap.has('bcv') ? queryMap.get('bcv') : getQuery('cv'),
      cn: getQuery('cn'),
      v: queryMap.has('bv') ? queryMap.get('bv') : getParam('batch')
    };
    return queryParams;
  }

  /**
   *
   */
  private findOverviewInputs(meta: ElementPageOverviewMetadata): FrontendOverviewSection {
    const statements: string[] = [];

    const submittedBy = meta.messageSubmittedBy.fullname;
    const submittedAtDate = formatDate(meta.messageSubmittedAt, 'fullDate', this.locale);
    const submittedAtTime = formatDate(meta.messageSubmittedAt, 'shortTime', this.locale);
    statements.push(`This testresult was submitted by <b>${submittedBy}</b> on ${submittedAtDate} at ${submittedAtTime}.`);

    // if difference between submission and creation of the message is more
    // than a day, show creation date as well.
    if (24 * 60 * 60 * 1000 < +new Date(meta.messageSubmittedAt) - +new Date(meta.messageBuiltAt)) {
      const builtAtDate = formatDate(meta.messageBuiltAt, 'fullDate', this.locale);
      const builtAtTime = formatDate(meta.messageBuiltAt, 'shortTime', this.locale);
      statements.push(`It was originally created on ${builtAtDate} at ${builtAtTime}`);
    }

    const elements: string[] = [];
    const pluralify = (v: number, type: string) => v === 1 ? type : type + 's';
    const stringify = (v: number, adj: string, type: string) => [ `<b>${v}</b>`, adj, pluralify(v, type) ].join(' ');
    const enumerate = (arr: string[]) => arr.length === 1 ? arr[0] : [ arr.slice(0, -1).join(', '), arr.slice(-1) ].join(' and ');
    if (meta.resultsCountFresh !== 0) {
      elements.push(stringify(meta.resultsCountFresh, 'new', 'key'));
    }
    if (meta.resultsCountMissing !== 0) {
      elements.push(stringify(meta.resultsCountMissing, 'missing', 'key'));
    }
    if (meta.metricsCountFresh !== 0) {
      elements.push(stringify(meta.metricsCountFresh, 'new', 'metric'));
    }
    if (meta.metricsCountMissing !== 0) {
      elements.push(stringify(meta.metricsCountMissing, 'missing', 'metric'));
    }
    if (elements.length !== 0) {
      statements.push(`This testresult has ${enumerate(elements)}.`);
    }

    const commonDifferent = meta.resultsCountDifferent - meta.resultsCountMissing;
    const commonHead = meta.resultsCountHead - meta.resultsCountFresh;
    if (commonDifferent !== 0) {
      const hasHave = meta.resultsCountDifferent === 1 ? 'has' : 'have';
      statements.push(`<b>${commonDifferent}</b> of ${commonHead} common keys in this testresult ${hasHave} mismatches.`);
    }

    return {
      inProgress: false,
      resultsScore: meta.resultsScore,
      metricsDurationHead: meta.metricsDurationHead,
      metricsDurationChange: meta.metricsDurationChange,
      metricsDurationSign: meta.metricsDurationSign,
      statements
    };
  }

}
