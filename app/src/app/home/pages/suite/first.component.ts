// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

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

@Component({
  selector: 'app-suite-first-batch',
  templateUrl: './first.component.html'
})
export class SuiteFirstBatchComponent implements OnDestroy {
  data: Partial<{
    apiKey: ApiKey;
    apiUrl: string;
  }> = {};

  private subscriptions: {
    suite: Subscription;
    user: Subscription;
  };

  constructor(
    private notificationService: NotificationService,
    faIconLibrary: FaIconLibrary,
    suitePageService: SuitePageService,
    userService: UserService
  ) {
    faIconLibrary.addIcons(faClipboard);
    const keys = userService.currentUser?.apiKeys;
    if (keys?.length) {
      this.data.apiKey = new ApiKey(keys[0]);
    }
    this.subscriptions = {
      suite: suitePageService.data.suite$.subscribe((v) => {
        this.data.apiUrl = [getBackendUrl(), '@', v.teamSlug, v.suiteSlug].join(
          '/'
        );
      }),
      user: userService.currentUser$.subscribe((v) => {
        this.data.apiKey = new ApiKey(v.apiKeys[0]);
      })
    };
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
  }

  onCopy(event: IClipboardResponse, name: string) {
    this.notificationService.notify(
      AlertType.Success,
      `Copied ${name} to clipboard.`
    );
  }
}
