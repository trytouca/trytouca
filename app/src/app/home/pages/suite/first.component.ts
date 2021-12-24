// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faClipboard } from '@fortawesome/free-solid-svg-icons';
import { IClipboardResponse } from 'ngx-clipboard';
import { Subscription } from 'rxjs';

import { ApiKey } from '@/core/models/api-key';
import { getBackendUrl } from '@/core/models/environment';
import { NotificationService, UserService } from '@/core/services';
import { AlertType } from '@/shared/components/alert.component';

import { SuitePageService } from './suite.service';

type Fields = Partial<{
  apiKey: ApiKey;
  apiUrl: string;
}>;

@Component({
  selector: 'app-suite-first-batch',
  templateUrl: './first.component.html'
})
export class SuiteFirstBatchComponent implements OnDestroy {
  fields: Fields = {};

  private _subSuite: Subscription;
  private _subUser: Subscription;

  constructor(
    private notificationService: NotificationService,
    faIconLibrary: FaIconLibrary,
    suitePageService: SuitePageService,
    userService: UserService
  ) {
    const keys = userService.currentUser?.apiKeys;
    if (keys?.length) {
      this.fields.apiKey = new ApiKey(keys[0]);
    }
    this._subUser = userService.currentUser$.subscribe((v) => {
      this.fields.apiKey = new ApiKey(v.apiKeys[0]);
    });
    this._subSuite = suitePageService.data.suite$.subscribe((v) => {
      this.fields.apiUrl = [getBackendUrl(), '@', v.teamSlug, v.suiteSlug].join(
        '/'
      );
    });
    faIconLibrary.addIcons(faClipboard);
  }

  ngOnDestroy(): void {
    this._subSuite.unsubscribe();
    this._subUser.unsubscribe();
  }

  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }
}
