// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { formatDate } from '@angular/common';
import {
  Component,
  HostListener,
  Inject,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faSpinner,
  faStopwatch,
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import type {
  BatchLookupResponse,
  ElementLookupResponse,
  SuiteLookupResponse
} from '@touca/api-schema';
import { debounceTime, Subscription } from 'rxjs';

import type {
  FrontendElementCompareParams,
  FrontendOverviewSection
} from '@/core/models/frontendtypes';
import { AlertKind, AlertService, EventService } from '@/core/services';
import { PageComponent, PageTab } from '@/home/components/page.component';
import { Alert, AlertType } from '@/shared/components/alert.component';

import {
  ElementPageOverviewMetadata,
  ElementPageResult
} from './element.model';
import { ElementPageService, ElementPageTabType } from './element.service';

type NotFound = Partial<{
  teamSlug: string;
  suiteSlug: string;
  batchSlug: string;
  elementSlug: string;
}>;

const allTabs: Array<PageTab<ElementPageTabType>> = [
  {
    type: 'assumptions',
    name: 'Assumptions',
    link: 'assumptions',
    icon: 'featherList',
    shown: true
  },
  {
    type: 'results',
    name: 'Results',
    link: 'results',
    icon: 'featherList',
    shown: true
  },
  {
    type: 'metrics',
    name: 'Metrics',
    link: 'metrics',
    icon: 'heroClock',
    shown: true
  }
];

@Component({
  selector: 'app-element-page',
  templateUrl: './page.component.html',
  providers: [ElementPageService, EventService]
})
export class ElementPageComponent
  extends PageComponent<ElementPageResult, NotFound>
  implements OnInit, OnDestroy
{
  data: Partial<{
    alert: Alert;
    batch: BatchLookupResponse;
    element: ElementLookupResponse;
    overview: FrontendOverviewSection;
    params: FrontendElementCompareParams;
    suite: SuiteLookupResponse;
    tab: PageTab<ElementPageTabType>;
    tabs: Array<PageTab<ElementPageTabType>>;
  }> = {
    tabs: []
  };

  private subscriptions: Record<
    | 'alert'
    | 'batch'
    | 'element'
    | 'event'
    | 'mapParams'
    | 'mapQueryParams'
    | 'overview'
    | 'params'
    | 'suite'
    | 'tab'
    | 'tabs',
    Subscription
  >;

  constructor(
    private elementPageService: ElementPageService,
    private router: Router,
    private titleService: Title,
    private route: ActivatedRoute,
    alertService: AlertService,
    eventService: EventService,
    faIconLibrary: FaIconLibrary,
    @Inject(LOCALE_ID) private locale: string
  ) {
    super(elementPageService);
    faIconLibrary.addIcons(faSpinner, faStopwatch, faTasks);
    this.subscriptions = {
      alert: alertService.alerts$.subscribe((v) => {
        if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
          this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
        }
        if (v.some((k) => k.kind === AlertKind.SuiteNotFound)) {
          this._notFound.suiteSlug = this.route.snapshot.paramMap.get('suite');
        }
        if (v.some((k) => k.kind === AlertKind.BatchNotFound)) {
          this._notFound.batchSlug = this.route.snapshot.paramMap.get('batch');
        }
        if (v.some((k) => k.kind === AlertKind.ElementNotFound)) {
          this._notFound.elementSlug =
            this.route.snapshot.paramMap.get('element');
        }
      }),
      batch: elementPageService.data.batch$.subscribe((v) => {
        this.data.batch = v;
      }),
      element: elementPageService.data.element$.subscribe((v) => {
        this.data.element = v;
        this.updateTitle(v);
      }),
      event: eventService.event$
        .pipe(debounceTime(250))
        .subscribe((v) => this.elementPageService.consumeEvent(v)),
      mapParams: route.paramMap.subscribe((v) => {
        // by ensuring that params is set, we avoid calling this function during
        // initial page load.
        if (this.data.params) {
          const params = this.data.params;
          params.teamSlug = v.get('team');
          params.srcSuiteSlug = v.get('suite');
          params.srcBatchSlug = v.get('batch');
          params.srcElementSlug = v.get('element');
          this.elementPageService.resetCache();
          this.elementPageService.updateRequestParams(params);
        }
      }),
      mapQueryParams: route.queryParamMap.subscribe((v) => {
        if (this.data.params) {
          const params = this.data.params;
          const getQuery = (key: string) => (v.has(key) ? v.get(key) : null);
          params.dstSuiteSlug = getQuery('cn');
          params.dstBatchSlug = getQuery('cv');
          params.dstElementSlug = getQuery('ct');
          this.elementPageService.resetCache();
          this.elementPageService.updateRequestParams(params);
        }
      }),
      overview: elementPageService.data.overview$.subscribe((v) => {
        for (const [tabType, counter] of [
          ['assumptions', 'assumptionsCountHead'],
          ['results', 'resultsCountHead'],
          ['metrics', 'metricsCountHead']
        ]) {
          const tab = this.data.tabs.find((t) => t.type === tabType);
          if (tab) {
            tab.counter = v[counter];
          }
        }
        this.data.overview = this.findOverviewInputs(v);
      }),
      params: elementPageService.data.params$.subscribe((v) => {
        this.data.params = v;
      }),
      suite: elementPageService.data.suite$.subscribe((v) => {
        this.data.suite = v;
      }),
      tab: elementPageService.data.tab$.subscribe(
        (v) => (this.data.tab = allTabs.find((t) => t.shown && t.type === v))
      ),
      tabs: elementPageService.data.tabs$.subscribe((tabs) => {
        this.data.tabs = allTabs.filter((v) => tabs.includes(v.type));
        const queryMap = route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : 'results';
        const tab = this.data.tabs.find((v) => v.link === getQuery('t'));
        this.elementPageService.updateCurrentTab(tab.type);
      })
    };
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnDestroy() {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
    super.ngOnDestroy();
  }

  fetchItems(): void {
    if (!this.data.params) {
      const queryMap = this.route.snapshot.queryParamMap;
      const paramMap = this.route.snapshot.paramMap;
      const getQuery = (key: string) =>
        queryMap.has(key) ? queryMap.get(key) : null;
      this.data.params = {
        currentTab: this.data.tab?.type,
        teamSlug: paramMap.get('team'),
        srcSuiteSlug: paramMap.get('suite'),
        srcBatchSlug: getQuery('v') || paramMap.get('batch'),
        srcBatchName: this.batchName(getQuery('v') || paramMap.get('batch')),
        srcElementSlug: paramMap.get('element'),
        dstSuiteSlug: getQuery('cn'),
        dstBatchSlug: getQuery('cv'),
        dstBatchName: this.batchName(getQuery('cv')),
        dstElementSlug: getQuery('ct')
      };
      this.setCustomAlerts();
    }
    this.elementPageService.updateRequestParams(this.data.params);
  }

  private setCustomAlerts() {
    const queryMap = this.route.snapshot.queryParamMap;
    if (queryMap.has('bv')) {
      this.data.alert = {
        type: AlertType.Info,
        text: `Element <b>${this.data.params.srcElementSlug}</b> is missing
          from version <b>${this.batchName(queryMap.get('bv'))}</b>.
          You are viewing results for version <b>${
            this.data.params.dstBatchName || this.data.params.srcBatchName
          }</b>.`
      };
    }
    if (queryMap.has('bcv')) {
      this.data.alert = {
        type: AlertType.Info,
        text: `Element <b>${this.data.params.srcElementSlug}</b> is missing
          from version <b>${this.batchName(queryMap.get('bcv'))}</b>.
          You are viewing results for version <b>${
            this.data.params.srcBatchName
          }</b>.`
      };
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Backspace' should return user to "Batch" page
    if ('Backspace' === event.key) {
      const queryParams = this.findPreviousPageQueryParams();
      this.router.navigate(['..'], { queryParams, relativeTo: this.route });
      event.stopImmediatePropagation();
    }
  }

  updateTitle(element: ElementLookupResponse) {
    const title = [
      element.elementName,
      element.suiteName,
      element.teamName,
      'Touca'
    ].join(' - ');
    this.titleService.setTitle(title);
  }

  public findPreviousPageQueryParams() {
    const paramMap = this.route.snapshot.paramMap;
    const queryMap = this.route.snapshot.queryParamMap;
    const getParam = (key: string) =>
      paramMap.has(key) ? paramMap.get(key) : null;
    const getQuery = (key: string) =>
      queryMap.has(key) ? queryMap.get(key) : null;
    const queryParams = {
      cv: queryMap.has('bcv') ? queryMap.get('bcv') : getQuery('cv'),
      cn: getQuery('cn'),
      v: queryMap.has('bv') ? queryMap.get('bv') : getParam('batch')
    };
    return queryParams;
  }

  private findOverviewInputs(
    meta: ElementPageOverviewMetadata
  ): FrontendOverviewSection {
    const statements: string[] = [];

    const submittedBy = meta.messageSubmittedBy.fullname;
    const submittedAtDate = formatDate(
      meta.messageSubmittedAt,
      'fullDate',
      this.locale
    );
    const submittedAtTime = formatDate(
      meta.messageSubmittedAt,
      'shortTime',
      this.locale
    );
    statements.push(
      `This test result was submitted by <b>${submittedBy}</b> on ${submittedAtDate} at ${submittedAtTime}.`
    );

    // if difference between submission and creation of the message is more
    // than a day, show creation date as well.
    if (
      24 * 60 * 60 * 1000 <
      +new Date(meta.messageSubmittedAt) - +new Date(meta.messageBuiltAt)
    ) {
      const builtAtDate = formatDate(
        meta.messageBuiltAt,
        'fullDate',
        this.locale
      );
      const builtAtTime = formatDate(
        meta.messageBuiltAt,
        'shortTime',
        this.locale
      );
      statements.push(
        `It was originally created on ${builtAtDate} at ${builtAtTime}`
      );
    }

    const elements: string[] = [];
    const plural = (v: number, type: string) => (v === 1 ? type : type + 's');
    const stringify = (v: number, adj: string, type: string) =>
      [`<b>${v}</b>`, adj, plural(v, type)].join(' ');
    const enumerate = (arr: string[]) =>
      arr.length === 1
        ? arr[0]
        : [arr.slice(0, -1).join(', '), arr.slice(-1)].join(' and ');
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
      statements.push(`This test result has ${enumerate(elements)}.`);
    }

    const commonDifferent =
      meta.resultsCountDifferent - meta.resultsCountMissing;
    const commonHead = meta.resultsCountHead - meta.resultsCountFresh;
    if (commonDifferent !== 0) {
      const hasHave = meta.resultsCountDifferent === 1 ? 'has' : 'have';
      statements.push(
        `<b>${commonDifferent}</b> of ${commonHead} common keys in this test result ${hasHave} mismatches.`
      );
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

  private batchName(batchSlug: string) {
    return batchSlug?.split('@')[0];
  }

  public switchTab(type: ElementPageTabType) {
    this.elementPageService.updateCurrentTab(type);
    if (!this.hasData()) {
      this.fetchItems();
    }
  }
}
