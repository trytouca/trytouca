/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faClipboard } from '@fortawesome/free-solid-svg-icons';
import { getBackendUrl } from '@weasel/core/models/environment';
import { NotificationService, UserService } from '@weasel/core/services';
import { AlertType } from '@weasel/shared/components/alert.component';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription } from 'rxjs';

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

  private _subSuite: Subscription;
  private _subUser: Subscription;

  /**
   *
   */
  constructor(
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
  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }
}
