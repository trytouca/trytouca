/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faBell,
  faChartLine,
  faCog,
  faComments,
  faRecycle,
  faRobot,
  faTasks
} from '@fortawesome/free-solid-svg-icons';
import { Subscription, timer } from 'rxjs';
import type {
  SuiteItem,
  SuiteLookupResponse,
  TeamItem
} from '@weasel/core/models/commontypes';
import {
  AlertKind,
  AlertService,
  NotificationService
} from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';
import { PageTab, PageComponent } from '@weasel/home/components/page.component';
import { SuitePageItem } from './suite.model';
import { SuitePageService, SuitePageTabType } from './suite.service';

const pageTabs: PageTab<SuitePageTabType>[] = [
  {
    type: SuitePageTabType.Versions,
    name: 'Versions',
    link: 'versions',
    icon: 'tasks',
    shown: true
  },
  {
    type: SuitePageTabType.Trends,
    name: 'Trends',
    link: 'trends',
    icon: 'chart-line',
    shown: true
  },
  {
    type: SuitePageTabType.Settings,
    name: 'Settings',
    link: 'settings',
    icon: 'cog',
    shown: true
  }
];

type NotFound = Partial<{
  teamSlug: string;
  suiteSlug: string;
}>;

type Fields = Partial<{
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
  styleUrls: ['../../styles/page.component.scss'],
  providers: [SuitePageService, { provide: 'PAGE_TABS', useValue: pageTabs }]
})
export class SuitePageComponent
  extends PageComponent<SuitePageItem, SuitePageTabType, NotFound>
  implements OnInit, OnDestroy {
  team: TeamItem;
  suite: SuiteLookupResponse;
  suites: SuiteItem[];
  TabType = SuitePageTabType;

  private _subTeam: Subscription;
  private _subSuite: Subscription;
  private _subSuites: Subscription;
  private _subAlert: Subscription;

  fields: Fields = {};

  /**
   *
   */
  constructor(
    private router: Router,
    private alertService: AlertService,
    private suitePageService: SuitePageService,
    private titleService: Title,
    private notificationService: NotificationService,
    private faIconLibrary: FaIconLibrary,
    route: ActivatedRoute
  ) {
    super(suitePageService, pageTabs, route);
    faIconLibrary.addIcons(
      faBell,
      faChartLine,
      faCog,
      faComments,
      faRecycle,
      faRobot,
      faTasks
    );
    this._subAlert = this.alertService.alerts$.subscribe((v) => {
      if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
        this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
      }
      if (v.some((k) => k.kind === AlertKind.SuiteNotFound)) {
        this._notFound.suiteSlug = this.route.snapshot.paramMap.get('suite');
      }
    });
    this._subTeam = this.suitePageService.team$.subscribe((v) => {
      this.team = v;
    });
    this._subSuites = this.suitePageService.suites$.subscribe((v) => {
      this.suites = v;
    });
    this._subSuite = this.suitePageService.suite$.subscribe((v) => {
      this.suite = v;
      this.tabs.find((t) => t.type === SuitePageTabType.Versions).counter =
        v.batchCount;
      this.updateFields();
      this.updateTitle(v);
    });
  }

  /**
   *
   */
  ngOnInit(): void {
    super.ngOnInit();
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subAlert.unsubscribe();
    this._subTeam.unsubscribe();
    this._subSuites.unsubscribe();
    this._subSuite.unsubscribe();
    super.ngOnDestroy();
  }

  /**
   *
   */
  fetchItems(): void {
    const teamSlug = this.route.snapshot.paramMap.get('team');
    const suiteSlug = this.route.snapshot.paramMap.get('suite');
    this.suitePageService.fetchItems({
      currentTab: this.currentTab,
      teamSlug,
      suiteSlug
    });
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Backspace' should return user to "Team" page
    if ('Backspace' === event.key) {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   *
   */
  public switchPage(suiteSlug: string) {
    if (this.suite.suiteSlug !== suiteSlug) {
      this.router.navigate(['~', this.suite.teamSlug, suiteSlug]);
      this.suitePageService.updateSuiteSlug(this.currentTab, suiteSlug);
    }
  }

  /**
   *
   */
  private updateTitle(suite: SuiteLookupResponse) {
    const title = [suite.suiteName, suite.teamName, 'Weasel'].join(' - ');
    this.titleService.setTitle(title);
  }

  /**
   *
   */
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

  /**
   *
   */
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
          timer(2000).subscribe(() => this.router.navigate(['/']));
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
