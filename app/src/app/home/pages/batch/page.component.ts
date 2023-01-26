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
import { faSpinner, faTasks } from '@fortawesome/free-solid-svg-icons';
import { DialogRef, DialogService } from '@ngneat/dialog';
import type {
  BatchItem,
  BatchLookupResponse,
  SuiteLookupResponse
} from '@touca/api-schema';
import { isEqual } from 'lodash-es';
import { debounceTime, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

import type {
  FrontendBatchCompareParams,
  FrontendOverviewSection
} from '@/core/models/frontendtypes';
import {
  AlertKind,
  AlertService,
  ApiService,
  EventService,
  UserService
} from '@/core/services';
import { ConfirmComponent, ConfirmElements } from '@/home/components';
import { PageComponent, PageTab } from '@/home/components/page.component';
import { AlertType } from '@/shared/components/alert.component';

import { BatchPageItem, BatchPageOverviewMetadata } from './batch.model';
import { BatchPageService, BatchPageTabType } from './batch.service';
import { BatchPromoteComponent } from './promote.component';
import { BatchSealComponent } from './seal.component';

type NotFound = Partial<{
  teamSlug: string;
  suiteSlug: string;
  batchSlug: string;
}>;

type PageButton = {
  click: () => void;
  title: string;
  text: string;
  icon?: string;
};

@Component({
  selector: 'app-batch-page',
  templateUrl: './page.component.html',
  providers: [BatchPageService, EventService]
})
export class BatchPageComponent
  extends PageComponent<BatchPageItem, NotFound>
  implements OnInit, OnDestroy
{
  data: Partial<{
    batch: BatchLookupResponse;
    batches: Array<BatchItem>;
    buttons: Array<PageButton>;
    dialogPromote: DialogRef;
    dialogSeal: DialogRef;
    overview: FrontendOverviewSection;
    params: FrontendBatchCompareParams;
    subButtons: Array<PageButton>;
    suite: SuiteLookupResponse;
    tab: BatchPageTabType;
    tabs: Array<PageTab<BatchPageTabType>>;
  }> = {
    buttons: [],
    subButtons: []
  };
  private _isTeamAdmin = false;

  private subscriptions: Record<
    | 'alert'
    | 'batch'
    | 'batches'
    | 'dialogPromote'
    | 'dialogSeal'
    | 'event'
    | 'mapParams'
    | 'mapQueryParams'
    | 'overview'
    | 'params'
    | 'suite'
    | 'tab'
    | 'tabs'
    | 'team',
    Subscription
  >;

  constructor(
    private apiService: ApiService,
    private batchPageService: BatchPageService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    alertService: AlertService,
    eventService: EventService,
    faIconLibrary: FaIconLibrary,
    userService: UserService,
    @Inject(LOCALE_ID) private locale: string
  ) {
    super(batchPageService);
    faIconLibrary.addIcons(faSpinner, faTasks);
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
      }),
      batch: batchPageService.data.batch$.subscribe((v) => {
        this.data.batch = v;
        this.updateTitle(v);
      }),
      batches: batchPageService.data.batches$.subscribe((v) => {
        this.data.batches = v.slice(0, 10);
      }),
      dialogPromote: undefined,
      dialogSeal: undefined,
      event: eventService.event$
        .pipe(debounceTime(250))
        .subscribe((v) => this.batchPageService.consumeEvent(v)),
      mapParams: route.paramMap.subscribe((v) => {
        // by ensuring that params is set, we avoid calling this function during
        // initial page load.
        if (this.data.params) {
          this.batchPageService.updateBatchSlug(v.get('batch'));
        }
      }),
      mapQueryParams: route.queryParamMap.subscribe((v) => {
        if (this.data.params) {
          const params = this.data.params;
          const getQuery = (key: string) => (v.has(key) ? v.get(key) : null);
          params.dstSuiteSlug = getQuery('cn');
          params.dstBatchSlug = getQuery('cv');
          this.batchPageService.updateRequestParams(params);
        }
      }),
      overview: batchPageService.data.overview$.subscribe((v) => {
        this.data.overview = this.findOverviewInputs(v);
        const buttons = this.findPageButtons();
        const subButtons = this.findPageSubButtons();
        if (!isEqual(buttons, this.data.buttons)) {
          this.data.buttons = buttons;
        }
        if (!isEqual(subButtons, this.data.subButtons)) {
          this.data.subButtons = subButtons;
        }
      }),
      params: batchPageService.data.params$.subscribe((v) => {
        this.data.params = v;
      }),
      suite: batchPageService.data.suite$.subscribe((v) => {
        this.data.suite = v;
      }),
      tab: batchPageService.data.tab$.subscribe((v) => {
        this.data.tab = v;
        this.data.params.currentTab = v;
      }),
      tabs: batchPageService.data.tabs$.subscribe((v) => {
        this.data.tabs = v;
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab = v.find((t) => t.link === getQuery('t')) || v[0];
        this.batchPageService.updateCurrentTab(tab.type);
      }),
      team: batchPageService.data.team$.subscribe((v) => {
        this._isTeamAdmin = userService.isTeamAdmin(v.role);
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
      const paramMap = this.route.snapshot.paramMap;
      const queryMap = this.route.snapshot.queryParamMap;
      const getQuery = (key: string) =>
        queryMap.has(key) ? queryMap.get(key) : null;
      const dstBatchSlug = getQuery('cv');
      this.data.params = {
        currentTab: this.data.tab,
        teamSlug: paramMap.get('team'),
        srcSuiteSlug: paramMap.get('suite'),
        srcBatchSlug: paramMap.get('batch'),
        srcBatchName: paramMap.get('batch').split('@')[0],
        dstSuiteSlug: getQuery('cn'),
        dstBatchSlug,
        dstBatchName: dstBatchSlug?.split('@')[0]
      };
    }
    this.batchPageService.updateRequestParams(this.data.params);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Escape' should hide seal or promote dialogs
    if ('Escape' === event.key) {
      if (!this.subscriptions.dialogPromote?.closed) {
        this.data.dialogPromote?.close();
      }
      if (!this.subscriptions.dialogSeal?.closed) {
        this.data.dialogSeal?.close();
      }
    }
    // pressing key 'Backspace' should return user to "Suite" page
    if ('Backspace' === event.key) {
      this.router.navigate(['..'], { relativeTo: this.route });
      event.stopImmediatePropagation();
    }
  }

  private updateTitle(batch: BatchLookupResponse) {
    const title = [
      batch.batchSlug,
      batch.suiteName,
      batch.teamName,
      'Touca'
    ].join(' - ');
    this.titleService.setTitle(title);
  }

  private findPageButtons(): PageButton[] {
    if (this.data.tab !== 'elements') {
      return [];
    }
    const buttons: PageButton[] = [];

    if (
      this.data.suite?.baseline?.batchSlug !== this.data.params?.srcBatchSlug &&
      this.data.suite?.baseline?.batchSlug !== this.data.params?.dstBatchSlug
    ) {
      buttons.push({
        click: () => {
          this.router.navigate([], {
            queryParams: { cv: this.data.suite.baseline.batchSlug },
            queryParamsHandling: 'merge'
          });
        },
        text: 'Compare To Baseline',
        title: 'Compare this version to Current Suite Baseline'
      });
    }

    if (!this.data.batch?.isSealed) {
      buttons.push({
        click: () => this.openSealModal(),
        text: 'Seal Version',
        title: 'Prevent future submissions to this version.'
      });
    }

    if (
      this.data.batch?.isSealed &&
      this.data.suite?.baseline?.batchSlug === this.data.params?.dstBatchSlug &&
      this.data.suite?.baseline?.batchSlug !== this.data.params?.srcBatchSlug
    ) {
      const src = new Date(this.data.batch?.submittedAt);
      const dst = new Date(this.data.suite?.baseline?.submittedAt);
      buttons.push({
        click: () => this.openPromoteModal(),
        text: src < dst ? 'Demote Version' : 'Promote Version',
        title: 'Set this version as suite baseline.'
      });
    }

    return buttons;
  }

  private findPageSubButtons(): PageButton[] {
    if (this.data.tab !== 'elements') {
      return [];
    }
    const buttons: PageButton[] = [];
    if (this.data.batch?.isSealed) {
      buttons.push({
        click: () => this.export('zip'),
        icon: 'featherArchive',
        text: 'Export Test Results',
        title: 'Export test results archive for this version.'
      });
    }
    if (!environment.self_hosted && this.data.batch?.isSealed) {
      buttons.push({
        click: () => this.export('pdf'),
        icon: 'featherDownloadCloud',
        text: 'Download PDF Report',
        title: 'Create a PDF report for this version.'
      });
    }
    if (
      this._isTeamAdmin &&
      this.data.batch?.isSealed &&
      this.data.suite?.baseline?.batchSlug !== this.data.params?.srcBatchSlug
    ) {
      buttons.push({
        click: () => this.removeVersion(),
        icon: 'featherTrash2',
        text: 'Remove Version',
        title: 'Remove all test results submitted for this version.'
      });
    }
    return buttons;
  }

  private openSealModal() {
    this.data.dialogSeal = this.dialogService.open(BatchSealComponent, {
      closeButton: false,
      data: { batch: this.data.batch },
      minHeight: '10vh'
    });
    this.subscriptions.dialogSeal = this.data.dialogSeal.afterClosed$.subscribe(
      (state: boolean) => {
        if (state) {
          this.batchPageService.removeCacheBatch();
          this.fetchItems();
        }
      }
    );
  }

  private openPromoteModal() {
    this.data.dialogPromote = this.dialogService.open(BatchPromoteComponent, {
      closeButton: false,
      data: { batch: this.data.batch },
      minHeight: '10vh'
    });
    this.subscriptions.dialogPromote =
      this.data.dialogPromote.afterClosed$.subscribe((state: boolean) => {
        if (state) {
          this.batchPageService.removeCacheBatch();
          this.router.navigate([], {
            queryParams: { cv: this.data.batch.batchSlug },
            queryParamsHandling: 'merge'
          });
        }
      });
  }

  private removeVersion() {
    const data: ConfirmElements = {
      title: `Remove Version ${this.data.batch.batchSlug}`,
      message:
        '<p>Are you sure you want to remove this version? This action' +
        ' permanently removes all submitted test results and comments' +
        ' associated with this version.</p>',
      button: 'Remove',
      severity: AlertType.Danger,
      confirmText: `${this.data.batch.batchSlug}`,
      confirmAction: () => {
        const url = [
          'batch',
          this.data.batch.teamSlug,
          this.data.batch.suiteSlug,
          this.data.batch.batchSlug
        ].join('/');
        return this.apiService.delete(url);
      },
      onActionSuccess: () => {
        this.batchPageService.removeCacheBatch();
        this.router.navigate(['..'], { relativeTo: this.route });
      }
    };
    this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data,
      minHeight: '10vh'
    });
  }

  private export(format: 'pdf' | 'zip') {
    const url = [
      'batch',
      this.data.batch.teamSlug,
      this.data.batch.suiteSlug,
      this.data.batch.batchSlug,
      'export',
      format
    ].join('/');
    this.apiService.getBinary(url).subscribe((blob) => {
      const name = `${this.data.batch.suiteSlug}_${this.data.batch.batchSlug}.${format}`;
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.download = name;
      link.href = objectUrl;
      link.style.visibility = 'hidden';
      link.target = '_blank';
      link.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
      setTimeout(() => URL.revokeObjectURL(objectUrl));
    });
  }

  private findOverviewInputs(
    meta: BatchPageOverviewMetadata
  ): FrontendOverviewSection {
    const statements: string[] = [];

    const submittedBy = meta.batchSubmittedBy
      .map((v) => `<b>${v.fullname}</b>`)
      .join(' and ');
    const submittedAtDate = formatDate(
      meta.batchSubmittedAt,
      'fullDate',
      this.locale
    );
    const submittedAtTime = formatDate(
      meta.batchSubmittedAt,
      'shortTime',
      this.locale
    );
    statements.push(
      `This version was submitted by ${submittedBy} on ${submittedAtDate} at ${submittedAtTime}.`
    );

    const elements: string[] = [];
    const pluralify = (v: number, type: string) =>
      v === 1 ? type : type + 's';
    const stringify = (v: number, adj: string, type: string) =>
      [`<b>${v}</b>`, adj, pluralify(v, type)].join(' ');
    const enumerate = (arr: string[]) =>
      arr.length === 1
        ? arr[0]
        : [arr.slice(0, -1).join(', '), arr.slice(-1)].join(' and ');
    if (meta.elementsCountFresh !== 0) {
      elements.push(stringify(meta.elementsCountFresh, 'new', 'testcase'));
    }
    if (meta.elementsCountMissing !== 0) {
      elements.push(
        stringify(meta.elementsCountMissing, 'missing', 'testcase')
      );
    }
    if (elements.length !== 0) {
      statements.push(`This version has ${enumerate(elements)}.`);
    }

    const commonDifferent =
      meta.elementsCountDifferent - meta.elementsCountMissing;
    const commonHead = meta.elementsCountHead - meta.elementsCountFresh;
    if (commonDifferent !== 0) {
      const hasHave = meta.elementsCountDifferent === 1 ? 'has' : 'have';
      statements.push(
        `<b>${commonDifferent}</b> of <b>${commonHead}</b> common testcases in this version ${hasHave} differences.`
      );
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

  public switchTab(type: BatchPageTabType) {
    this.data.tab = type;
    if (!this.hasData()) {
      this.fetchItems();
    }
  }
}
