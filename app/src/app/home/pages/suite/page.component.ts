// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription, timer } from 'rxjs';

import { ApiKey } from '@/core/models/api-key';
import type {
  SuiteItem,
  SuiteLookupResponse,
  TeamItem
} from '@/core/models/commontypes';
import { ENotificationType } from '@/core/models/commontypes';
import { getBackendUrl } from '@/core/models/environment';
import {
  AlertKind,
  AlertService,
  NotificationService,
  UserService
} from '@/core/services';
import { PageComponent, PageTab } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

import { SuitePageItem } from './suite.model';
import {
  SuiteBannerType,
  SuitePageService,
  SuitePageTabType
} from './suite.service';

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
  providers: [SuitePageService]
})
export class SuitePageComponent
  extends PageComponent<SuitePageItem, NotFound>
  implements OnInit, OnDestroy
{
  team: TeamItem;
  suites: SuiteItem[];
  suite: SuiteLookupResponse;
  fields: Fields = {};
  levels = [
    {
      icon: 'feather-rss',
      type: ENotificationType.All,
      text: 'Get notified of all new versions.'
    },
    {
      icon: 'feather-alert-circle',
      type: ENotificationType.Different,
      text: 'Get notified of versions with differences.'
    },
    {
      icon: 'feather-bell-off',
      type: ENotificationType.None,
      text: 'Stop all notifications about this suite.'
    }
  ];

  tabs: PageTab<SuitePageTabType>[];
  currentTab: SuitePageTabType;
  TabType = SuitePageTabType;

  banner: SuiteBannerType;
  BannerType = SuiteBannerType;
  NotificationType = ENotificationType;

  private _sub: Record<
    'alert' | 'banner' | 'tabs' | 'team' | 'suites' | 'suite' | 'user',
    Subscription
  >;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private suitePageService: SuitePageService,
    private titleService: Title,
    private notificationService: NotificationService,
    alertService: AlertService,
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
      banner: suitePageService.banner$.subscribe((v) => {
        this.banner = v;
        if (this.banner === this.BannerType.SuiteNotFound) {
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
          this._notFound.suiteSlug = route.snapshot.paramMap.get('suite');
        }
      }),
      tabs: suitePageService.data.tabs$.subscribe((v) => {
        this.tabs = v;
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab = this.tabs.find((v) => v.link === getQuery('t')) || v[0];
        this.currentTab = tab.type;
      }),
      team: suitePageService.data.team$.subscribe((v) => {
        this.team = v;
      }),
      suites: suitePageService.data.suites$.subscribe((v) => {
        this.suites = v;
      }),
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
      currentTab: this.currentTab,
      teamSlug: this.route.snapshot.paramMap.get('team'),
      suiteSlug: this.route.snapshot.paramMap.get('suite')
    });
  }

  switchTab(type: SuitePageTabType) {
    this.currentTab = type;
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
      this.suitePageService.updateSuiteSlug(this.currentTab, suiteSlug);
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
