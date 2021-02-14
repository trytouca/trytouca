/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faClipboard } from '@fortawesome/free-solid-svg-icons';
import {
  ApiService,
  NotificationService,
  UserService
} from '@weasel/core/services';
import { getBackendUrl } from '@weasel/core/models/environment';
import { AlertType } from '@weasel/shared/components/alert.component';
import { SuitePageService } from './suite.service';

type Fields = Partial<{
  apiKey: string;
  apiUrl: string;
}>;

@Component({
  selector: 'app-suite-first-batch',
  templateUrl: './first.component.html',
  styleUrls: ['./first.component.scss']
})
export class SuiteFirstBatchComponent implements OnDestroy {
  fields: Fields = {};
  private _slugs: { team: string; suite: string };

  private _subSuite: Subscription;
  private _subUser: Subscription;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    faIconLibrary: FaIconLibrary,
    suitePageService: SuitePageService,
    userService: UserService
  ) {
    if (userService?.currentUser?.apiKeys?.length !== 0) {
      this.fields.apiKey = userService?.currentUser?.apiKeys[0];
    }
    this._subUser = userService.currentUser$.subscribe((v) => {
      this.fields.apiKey = v.apiKeys[0];
    });
    this._subSuite = suitePageService.suite$.subscribe((v) => {
      this._slugs = { team: v.teamSlug, suite: v.suiteSlug };
      this.fields.apiUrl = [getBackendUrl(), '@', v.teamSlug, v.suiteSlug].join(
        '/'
      );
    });
    faIconLibrary.addIcons(faClipboard);
  }

  /**
   *
   */
  ngOnDestroy(): void {
    this._subSuite.unsubscribe();
    this._subUser.unsubscribe();
  }

  /**
   *
   */
  onCopy(event: string, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }

  /**
   *
   */
  populate() {
    const url = ['suite', this._slugs.team, this._slugs.suite, 'populate'];
    this.apiService.post(url.join('/')).subscribe(
      () => {
        this.notificationService.notify(
          AlertType.Info,
          'Adding sample results. This should take no more than a few seconds.'
        );
      },
      () =>
        this.notificationService.notify(
          AlertType.Danger,
          'We were not able to add sample test results to this suite.'
        )
    );
  }
}
