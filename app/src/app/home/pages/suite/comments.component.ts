// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';

import { PromotionItem } from '@/core/models/frontendtypes';
import { UserService } from '@/core/services';

import { SuitePageService } from './suite.service';

@Component({
  selector: 'app-suite-tab-comments',
  templateUrl: './comments.component.html'
})
export class SuiteListCommentsComponent {
  promotions: PromotionItem[] = [];

  constructor(suitePageService: SuitePageService, userService: UserService) {
    suitePageService.data.suite$.subscribe((suite) => {
      const promotions = suite.promotions
        .map((v) => {
          const bySelf = userService.currentUser.username === v.by.username;
          return { ...v, bySelf };
        })
        .sort((a, b) => +new Date(b.at) - +new Date(a.at));
      // since first batch of the suite is always the baseline, remove its
      // corresponding promotion entry because it has no value for the user.
      promotions.pop();
      this.promotions = promotions;
    });
  }
}
