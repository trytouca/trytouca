// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { PromotionItem } from '@/core/models/frontendtypes';
import { UserService } from '@/core/services';

import { SuitePageService } from './suite.service';

@Component({
  selector: 'app-suite-tab-comments',
  templateUrl: './comments.component.html'
})
export class SuiteListCommentsComponent implements OnDestroy {
  data: { promotions: Array<PromotionItem> } = { promotions: [] };
  private subscriptions: Partial<{
    suite: Subscription;
  }>;

  constructor(suitePageService: SuitePageService, userService: UserService) {
    this.subscriptions = {
      suite: suitePageService.data.suite$.subscribe((suite) => {
        const promotions = suite.promotions
          .map((v) => {
            const bySelf = userService.currentUser.username === v.by.username;
            return { ...v, bySelf };
          })
          .sort((a, b) => +new Date(b.at) - +new Date(a.at));
        // since first batch of the suite is always the baseline, remove its
        // corresponding promotion entry because it has no value for the user.
        promotions.pop();
        this.data.promotions = promotions;
      })
    };
  }

  ngOnDestroy(): void {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
  }
}
