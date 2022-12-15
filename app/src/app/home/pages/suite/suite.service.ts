// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type {
  BatchListResponse,
  ElementListResponse,
  ENotificationType,
  ServerEventJob,
  SuiteItem,
  SuiteLookupResponse,
  TeamLookupResponse
} from '@touca/api-schema';
import { isEqual } from 'lodash-es';
import { forkJoin, Observable, of, Subject } from 'rxjs';

import { FrontendBatchItem } from '@/core/models/frontendtypes';
import { AlertKind, AlertService, ApiService } from '@/core/services';
import { PageTab } from '@/home/components';
import { IPageService } from '@/home/models/pages.model';
import { errorLogger } from '@/shared/utils/errorLogger';

import { SuitePageElement, SuitePageItem } from './suite.model';

export type SuitePageTabType = 'versions' | 'testcases' | 'settings';
type SuiteBannerType = 'suite-not-found';

type FetchInput = {
  teamSlug: string;
  suiteSlug: string;
};

const availableTabs: Record<SuitePageTabType, PageTab<SuitePageTabType>> = {
  versions: {
    type: 'versions',
    name: 'Versions',
    link: 'versions',
    icon: 'feather-list',
    shown: true
  },
  testcases: {
    type: 'testcases',
    name: 'Test Cases',
    link: 'testcases',
    icon: 'feather-file-text',
    shown: true
  },
  settings: {
    type: 'settings',
    name: 'Settings',
    link: 'settings',
    icon: 'feather-settings',
    shown: true
  }
};

@Injectable()
export class SuitePageService extends IPageService<SuitePageItem> {
  private cache: Partial<{
    tab: SuitePageTabType;
    tabs: PageTab<SuitePageTabType>[];
    team: TeamLookupResponse;
    suites: SuiteItem[];
    suite: SuiteLookupResponse;
    batches: BatchListResponse;
    elements: ElementListResponse;
  }> = { tab: 'versions' };

  private subjects = {
    banner: new Subject<SuiteBannerType>(),
    tab: new Subject<SuitePageTabType>(),
    tabs: new Subject<PageTab<SuitePageTabType>[]>(),
    team: new Subject<TeamLookupResponse>(),
    suites: new Subject<SuiteItem[]>(),
    suite: new Subject<SuiteLookupResponse>(),
    batches: new Subject<BatchListResponse>(),
    elements: new Subject<SuitePageElement[]>()
  };

  data = {
    banner$: this.subjects.banner.asObservable(),
    tab$: this.subjects.tab.asObservable(),
    tabs$: this.subjects.tabs.asObservable(),
    team$: this.subjects.team.asObservable(),
    suites$: this.subjects.suites.asObservable(),
    suite$: this.subjects.suite.asObservable(),
    batches$: this.subjects.batches.asObservable(),
    elements$: this.subjects.elements.asObservable()
  };

  constructor(
    private alertService: AlertService,
    private apiService: ApiService
  ) {
    super();
  }

  consumeEvent(job: ServerEventJob) {
    if (
      this.cache.tab === 'versions' &&
      ['batch:created', 'batch:updated', 'batch:sealed'].includes(job.type)
    ) {
      const args = {
        teamSlug: this.cache.team.slug,
        suiteSlug: this.cache.suite.suiteSlug
      };
      if (['batch:created', 'batch:sealed'].includes(job.type)) {
        this.cache.suite = null;
      }
      this.cache.batches = null;
      this.fetchItems(args);
    }
  }

  private update = (key: string, response: unknown) => {
    if (response && !isEqual(response, this.cache[key])) {
      this.cache[key] = response;
      (this.subjects[key] as Subject<unknown>).next(response);
    }
  };

  private prepareTabs() {
    const tabs: PageTab<SuitePageTabType>[] = [
      {
        ...availableTabs.versions,
        counter: this.cache.batches.length
      },
      {
        ...availableTabs.testcases,
        counter: this.cache.elements.length
      },
      availableTabs.settings
    ];
    this.update('tabs', tabs);
  }

  private prepareBatches(doc: BatchListResponse) {
    if (!doc) {
      return;
    }
    this.update('batches', doc);
    const items = doc
      .map((v) => {
        const batch = v as FrontendBatchItem;
        batch.isBaseline =
          batch.batchSlug === this.cache.suite?.baseline?.batchSlug;
        return new SuitePageItem(batch, 'batch');
      })
      .sort(SuitePageItem.compareByDate);
    if (items && !isEqual(items, this._items)) {
      this._items = items;
      this._itemsSubject.next(this._items);
    }
  }

  private prepareElements(doc: ElementListResponse) {
    if (!doc) {
      return;
    }
    const items = doc.map((v) => new SuitePageElement(v, 'element'));
    this.update('elements', items);
  }

  public fetchItems(args: FetchInput): void {
    const url = [
      ['team', args.teamSlug],
      ['suite', args.teamSlug],
      ['suite', args.teamSlug, args.suiteSlug],
      ['batch', args.teamSlug, args.suiteSlug],
      ['element', 'v2', args.teamSlug, args.suiteSlug]
    ];
    const elements = ['team', 'suites', 'suite', 'batches', 'elements'];
    const requests = elements.map((key, index) => {
      return this.cache[key]
        ? of(0)
        : this.apiService.get<unknown>(url[index].join('/'));
    });
    // ensure that we always periodically poll list of versions
    if (this.cache.tab == 'versions') {
      requests[3] = this.apiService.get<unknown>(url[3].join('/'));
    }
    forkJoin(requests).subscribe({
      next: (doc) => {
        this.update('team', doc[0]);
        this.update('suites', doc[1]);
        this.update('suite', doc[2]);
        this.prepareBatches(doc[3] as BatchListResponse);
        this.prepareElements(doc[4] as ElementListResponse);
        this.prepareTabs();
        this.alertService.unset(
          AlertKind.ApiConnectionDown,
          AlertKind.ApiConnectionLost,
          AlertKind.TeamNotFound,
          AlertKind.SuiteNotFound
        );
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
          this.alertService.set(AlertKind.SuiteNotFound);
        } else {
          errorLogger.notify(err);
        }
      }
    });
  }

  public updateCurrentTab(tab: SuitePageTabType) {
    this.cache.tab = tab;
    this.subjects.tab.next(tab);
  }

  /**
   * Updates new information to all components of the suite page in the event
   * that the suite slug changes during the lifetime of this page.
   *
   * Team slug may change in two cases:
   *  - User switches to another suite
   *  - User updates slug of this suite
   */
  public updateSuiteSlug(suiteSlug: string): void {
    const teamSlug = this.cache.suite.teamSlug;
    this.cache.suites = null;
    this.cache.suite = null;
    this.cache.batches = null;
    this.cache.elements = null;
    this.fetchItems({ teamSlug, suiteSlug });
  }

  public updateSubscription(level: ENotificationType): Observable<void> {
    const url = [
      'suite',
      this.cache.suite.teamSlug,
      this.cache.suite.suiteSlug,
      'subscribe'
    ].join('/');
    return this.apiService.patch(url, { level });
  }
}
