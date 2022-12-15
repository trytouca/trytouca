// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ENotificationType,
  SuiteItem,
  SuiteLookupResponse,
  TeamItem
} from '@touca/api-schema';
import { IClipboardResponse } from 'ngx-clipboard';
import { debounceTime, Subscription } from 'rxjs';

import { ApiKey } from '@/core/models/api-key';
import { getBackendUrl } from '@/core/models/environment';
import {
  AlertKind,
  AlertService,
  EventService,
  NotificationService,
  UserService
} from '@/core/services';
import { PageComponent, PageTab } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

import { SuitePageItem } from './suite.model';
import { SuitePageService, SuitePageTabType } from './suite.service';

type NotFound = Partial<{
  teamSlug: string;
  suiteSlug: string;
}>;

type Fields = Partial<{
  apiKey: ApiKey;
  apiUrl: string;
}>;

@Component({
  selector: 'app-suite-page',
  templateUrl: './page.component.html',
  providers: [SuitePageService, EventService]
})
export class SuitePageComponent
  extends PageComponent<SuitePageItem, NotFound>
  implements OnInit, OnDestroy
{
  currentTab: SuitePageTabType;
  team: TeamItem;
  suites: Array<SuiteItem>;
  suite: SuiteLookupResponse;
  fields: Fields = {};
  tabs: Array<PageTab<SuitePageTabType>>;
  levels: { icon: string; type: ENotificationType; text: string }[] = [
    {
      icon: 'feather-rss',
      type: 'all',
      text: 'Get notified of all new versions.'
    },
    {
      icon: 'feather-alert-circle',
      type: 'different',
      text: 'Get notified of versions with differences.'
    },
    {
      icon: 'feather-bell-off',
      type: 'none',
      text: 'Stop all notifications about this suite.'
    }
  ];

  private _sub: Record<
    | 'alert'
    | 'banner'
    | 'event'
    | 'suite'
    | 'suites'
    | 'tab'
    | 'tabs'
    | 'team'
    | 'user',
    Subscription
  >;

  constructor(
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private suitePageService: SuitePageService,
    private titleService: Title,
    alertService: AlertService,
    eventService: EventService,
    userService: UserService
  ) {
    super(suitePageService);
    this._sub = {
      alert: alertService.alerts$.subscribe((v) => {
        if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
          this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
        }
        if (v.some((k) => k.kind === AlertKind.SuiteNotFound)) {
          this._notFound.suiteSlug = this.route.snapshot.paramMap.get('suite');
        }
      }),
      banner: suitePageService.data.banner$.subscribe((v) => {
        if (v === 'suite-not-found') {
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
          this._notFound.suiteSlug = route.snapshot.paramMap.get('suite');
        }
      }),
      event: eventService.event$
        .pipe(debounceTime(250))
        .subscribe((v) => this.suitePageService.consumeEvent(v)),
      suite: suitePageService.data.suite$.subscribe((v) => {
        this.suite = v;
        this.fields.apiUrl = [
          getBackendUrl(),
          '@',
          v.teamSlug,
          v.suiteSlug
        ].join('/');
        this.updateTitle(v);
      }),
      suites: suitePageService.data.suites$.subscribe((v) => {
        this.suites = v;
      }),
      tab: suitePageService.data.tab$.subscribe((v) => (this.currentTab = v)),
      tabs: suitePageService.data.tabs$.subscribe((v) => {
        this.tabs = v;
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab = this.tabs.find((v) => v.link === getQuery('t')) || v[0];
        this.suitePageService.updateCurrentTab(tab.type);
      }),
      team: suitePageService.data.team$.subscribe((v) => {
        this.team = v;
      }),
      user: userService.currentUser$.subscribe((v) => {
        this.fields.apiKey = new ApiKey(v.apiKeys[0]);
      })
    };
    const keys = userService.currentUser?.apiKeys;
    if (keys?.length) {
      this.fields.apiKey = new ApiKey(keys[0]);
    }
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  ngOnDestroy() {
    Object.values(this._sub)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
    super.ngOnDestroy();
  }

  fetchItems(): void {
    this.suitePageService.fetchItems({
      teamSlug: this.route.snapshot.paramMap.get('team'),
      suiteSlug: this.route.snapshot.paramMap.get('suite')
    });
  }

  switchTab(type: SuitePageTabType) {
    this.suitePageService.updateCurrentTab(type);
  }

  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Backspace' should return user to "Team" page
    if ('Backspace' === event.key) {
      this.router.navigate(['..'], { relativeTo: this.route });
      event.stopImmediatePropagation();
    }
  }

  public switchPage(suiteSlug: string) {
    if (this.suite.suiteSlug !== suiteSlug) {
      this.router.navigate(['~', this.suite.teamSlug, suiteSlug]);
      this.suitePageService.updateSuiteSlug(suiteSlug);
    }
  }

  private updateTitle(suite: SuiteLookupResponse) {
    const title = [suite.suiteName, suite.teamName, 'Touca'].join(' - ');
    this.titleService.setTitle(title);
  }

  set subscription(type: ENotificationType) {
    this.suitePageService.updateSubscription(type).subscribe({
      next: () => {
        this.suite.subscription = type;
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.notify(
          AlertType.Danger,
          'We are sorry, something went wrong. Please try this operation at a later time.'
        );
      }
    });
  }
}
