// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

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
  subscribe: {
    action: 'subscribe' | 'unsubscribe';
    count: number;
    message: string;
    name: string;
    title: string;
  };
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

  tabs: PageTab<SuitePageTabType>[];
  currentTab: SuitePageTabType;
  TabType = SuitePageTabType;

  banner: SuiteBannerType;
  BannerType = SuiteBannerType;

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
        this.updateFields();
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

  private updateFields() {
    this.fields.subscribe = {
      action: this.suite.isSubscribed ? 'unsubscribe' : 'subscribe',
      count: this.suite.subscriberCount,
      message: this.suite.isSubscribed
        ? 'You will no longer receive notifications for this testsuite.'
        : 'You are now subscribed to this suite. You will receive notifications for this testsuite.',
      name: this.suite.isSubscribed ? 'Unsubscribe' : 'Subscribe',
      title: this.suite.isSubscribed
        ? 'Unsubscribe from this Suite.'
        : 'Subscribe to this suite.'
    };
  }

  public toggleSubscription(): void {
    const action = this.fields.subscribe.action;
    const successMessage = this.fields.subscribe.message;
    this.suitePageService.updateSubscription(action).subscribe(
      () => {
        this.suite.isSubscribed = action === 'subscribe';
        this.suite.subscriberCount += action === 'subscribe' ? 1 : -1;
        this.updateFields();
        this.notificationService.notify(AlertType.Success, successMessage);
      },
      (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.notificationService.notify(
            AlertType.Danger,
            'Your user session has expired. Please login again.'
          );
          timer(2000).subscribe(() => {
            this.router.navigate(['/']);
          });
          return;
        }
        this.notificationService.notify(
          AlertType.Danger,
          'We are sorry, something went wrong. ' +
            'Please try this operation at a later time.'
        );
      }
    );
  }
}
