/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Inject, LOCALE_ID } from '@angular/core';
import { formatDate } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faComments, faSpinner, faTasks } from '@fortawesome/free-solid-svg-icons';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';
import type { BatchItem, BatchLookupResponse, SuiteLookupResponse } from 'src/app/core/models/commontypes';
import type { FrontendBatchCompareParams, FrontendOverviewSection } from 'src/app/core/models/frontendtypes';
import { AlertKind, AlertService } from 'src/app/core/services';
import { PageComponent, PageTab } from 'src/app/home/components/page.component';
import { BatchPageItem, BatchPageOverviewMetadata } from './batch.model';
import { BatchPageService, BatchPageTabType } from './batch.service';
import { BatchPromoteComponent } from './promote.component';
import { BatchSealComponent } from './seal.component';

const pageTabs: PageTab<BatchPageTabType>[] = [
  {
    type: BatchPageTabType.Elements,
    name: 'Testcases',
    link: 'testcases',
    icon: 'tasks',
    shown: true
  },
  {
    type: BatchPageTabType.Comments,
    name: 'Comments',
    link: 'comments',
    icon: 'comments',
    shown: true
  }
];

type NotFound = Partial<{
  teamSlug: string
  suiteSlug: string
  batchSlug: string
}>;

type PageButton = {
  click: () => void;
  title: string;
  text: string;
};

@Component({
  selector: 'app-batch-page',
  templateUrl: './page.component.html',
  providers: [ BatchPageService, { provide: 'PAGE_TABS', useValue: pageTabs } ]
})
export class BatchPageComponent extends PageComponent<BatchPageItem, BatchPageTabType, NotFound> implements OnInit, OnDestroy {

  suite: SuiteLookupResponse;
  batches: BatchItem[];
  batch: BatchLookupResponse;
  buttons: PageButton[];
  overview: FrontendOverviewSection;
  params: FrontendBatchCompareParams;
  TabType = BatchPageTabType;

  private _subSuite: Subscription;
  private _subBatches: Subscription;
  private _subBatch: Subscription;
  private _subOverview: Subscription;

  // the following subscriptions should be moved to parent component

  private _subAlert: Subscription;
  private _subParams: Subscription;
  private _subParamMap: Subscription;
  private _subQueryParamMap: Subscription;

  private _modalRefPromote: NgbModalRef;
  private _modalRefSeal: NgbModalRef;

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private batchPageService: BatchPageService,
    private modalService: NgbModal,
    private router: Router,
    private titleService: Title,
    private faIconLibrary: FaIconLibrary,
    route: ActivatedRoute,
    @Inject(LOCALE_ID) private locale: string
  ) {
    super(batchPageService, pageTabs, route);
    faIconLibrary.addIcons(faComments, faSpinner, faTasks);
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
    });
    this._subSuite = this.batchPageService.suite$.subscribe(v => {
      this.suite = v;
    });
    this._subBatches = this.batchPageService.batches$.subscribe(v => {
      this.batches = v.slice(0, 10);
    });
    this._subBatch = this.batchPageService.batch$.subscribe(v => {
      this.batch = v;
      this.tabs.find(t => t.type === BatchPageTabType.Comments).counter = v.commentCount;
      this.tabs.find(t => t.type === BatchPageTabType.Elements).counter = v.messageCount;
      this.updateTitle(v);
    });
    this._subOverview = this.batchPageService.overview$.subscribe(v => {
      this.overview = this.findOverviewInputs(v);
      const buttons = this.findPageButtons();
      if (!isEqual(buttons, this.buttons)) {
        this.buttons = buttons;
      }
    });
    this._subParams = this.batchPageService.params$.subscribe(v => {
      this.params = v;
    });
    this._subParamMap = this.route.paramMap.subscribe(v => {
      // by ensuring that params is set, we avoid calling this function during
      // initial page load.
      if (this.params) {
        this.batchPageService.updateBatchSlug(v.get('batch'));
      }
    });
    this._subQueryParamMap = this.route.queryParamMap.subscribe(v => {
      if (this.params) {
        const params = this.params;
        const getQuery = (key: string) => v.has(key) ? v.get(key) : null;
        params.dstSuiteSlug = getQuery('cn');
        params.dstBatchSlug = getQuery('cv');
        this.batchPageService.updateRequestParams(params);
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
    this._subBatches.unsubscribe();
    this._subBatch.unsubscribe();
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
      const paramMap = this.route.snapshot.paramMap;
      const queryMap = this.route.snapshot.queryParamMap;
      const getQuery = (key: string) => queryMap.has(key) ? queryMap.get(key) : null;
      this.params = {
        currentTab: this.currentTab,
        teamSlug: paramMap.get('team'),
        srcSuiteSlug: paramMap.get('suite'),
        srcBatchSlug: paramMap.get('batch'),
        dstSuiteSlug: getQuery('cn'),
        dstBatchSlug: getQuery('cv')
      };
    }
    this.batchPageService.updateRequestParams(this.params);
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Escape' should hide seal or promote dialogs
    if ('Escape' === event.key) {
      this._modalRefSeal.close();
      this._modalRefPromote.close();
    }
    // pressing key 'Backspace' should return user to "Suite" page
    if ('Backspace' === event.key) {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   *
   */
  private updateTitle(batch: BatchLookupResponse) {
    const title = [batch.batchSlug, batch.suiteName, batch.teamName, 'Weasel'].join(' - ');
    this.titleService.setTitle(title);
  }

  /**
   *
   */
  private findPageButtons(): PageButton[] {
    if (this.currentTab !== this.TabType.Elements) {
      return [];
    }
    const buttons: PageButton[] = [];

    if (this.suite?.baseline?.batchSlug !== this.params?.srcBatchSlug
      && this.suite?.baseline?.batchSlug !== this.params?.dstBatchSlug) {
      buttons.push({
        click: () => {
          this.router.navigate([], {
            queryParams: { cv: this.suite.baseline.batchSlug },
            queryParamsHandling: 'merge'
          });
        },
        text: 'Compare To Baseline',
        title: 'Compare this version to Current Suite Baseline'
      });
    }

    if (!this.batch?.isSealed) {
      buttons.push({
        click: () => this.openSealModal(),
        text: 'Seal Version',
        title: 'Prevent future submissions to this version.'
      });
    }

    if (this.batch?.isSealed
      && this.suite?.baseline?.batchSlug === this.params?.dstBatchSlug
      && this.suite?.baseline?.batchSlug !== this.params?.srcBatchSlug) {
      const src = new Date(this.batch?.submittedAt);
      const dst = new Date(this.suite?.baseline?.submittedAt);
      buttons.push({
        click: () => this.openPromoteModal(),
        text: src < dst ? 'Demote Version' : 'Promote Version',
        title: 'Set this version as suite baseline.'
      });
    }

    return buttons;
  }

  /**
   *
   */
  private openSealModal() {
    this._modalRefSeal = this.modalService.open(BatchSealComponent);
    this._modalRefSeal.componentInstance.batch = this.batch;
    this._modalRefSeal.result
      .then((state: boolean) => {
        if (state) {
          this.batchPageService.removeCacheBatch();
          this.fetchItems();
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  private openPromoteModal() {
    this._modalRefPromote = this.modalService.open(BatchPromoteComponent);
    this._modalRefPromote.componentInstance.batch = this.batch;
    this._modalRefPromote.result
      .then((state: boolean) => {
        if (state) {
          this.batchPageService.removeCacheSuiteAndBatches();
          this.router.navigate([], {
            queryParams: { cv: this.batch.batchSlug },
            queryParamsHandling: 'merge'
          });
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  private findOverviewInputs(meta: BatchPageOverviewMetadata): FrontendOverviewSection {
    const statements: string[] = [];

    const submittedBy = meta.batchSubmittedBy.map(v => `<b>${v.fullname}</b>`).join(' and ');
    const submittedAtDate = formatDate(meta.batchSubmittedAt, 'fullDate', this.locale);
    const submittedAtTime = formatDate(meta.batchSubmittedAt, 'shortTime', this.locale);
    statements.push(`This version was submitted by ${submittedBy} on ${submittedAtDate} at ${submittedAtTime}.`);

    const elements: string[] = [];
    const pluralify = (v: number, type: string) => v === 1 ? type : type + 's';
    const stringify = (v: number, adj: string, type: string) => [ `<b>${v}</b>`, adj, pluralify(v, type) ].join(' ');
    const enumerate = (arr: string[]) => arr.length === 1 ? arr[0] : [ arr.slice(0, -1).join(', '), arr.slice(-1) ].join(' and ');
    if (meta.elementsCountFresh !== 0) {
      elements.push(stringify(meta.elementsCountFresh, 'new', 'testcase'));
    }
    if (meta.elementsCountMissing !== 0) {
      elements.push(stringify(meta.elementsCountMissing, 'missing', 'testcase'));
    }
    if (elements.length !== 0) {
      statements.push(`This version has ${enumerate(elements)}.`);
    }

    const commonDifferent = meta.elementsCountDifferent - meta.elementsCountMissing;
    const commonHead = meta.elementsCountHead - meta.elementsCountFresh;
    if (commonDifferent !== 0) {
      const hasHave = meta.elementsCountDifferent === 1 ? 'has' : 'have';
      statements.push(`<b>${commonDifferent}</b> of <b>${commonHead}</b> common testcases in this version ${hasHave} differences.`);
    }

    return {
      inProgress: !meta.batchIsSealed || meta.elementsCountPending !== 0,
      metricsDurationHead: meta.metricsDurationHead,
      metricsDurationChange: meta.metricsDurationChange,
      metricsDurationSign: meta.metricsDurationSign,
      resultsScore: meta.elementsScoreAggregate,
      statements
    };
  }

}
