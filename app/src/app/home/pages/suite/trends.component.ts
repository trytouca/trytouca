/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnDestroy } from '@angular/core';
import { isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';

import { SuitePageItemType } from './suite.model';
import { SuitePageService } from './suite.service';

type Fields = Partial<{
  perfs: {
    slug: string;
    duration: number;
  }[];
}>;

@Component({
  selector: 'app-suite-tab-trends',
  templateUrl: './trends.component.html'
})
export class SuiteTabTrendsComponent implements OnDestroy {
  fields: Fields = {
    perfs: []
  };

  private _subItems: Subscription;

  /**
   *
   */
  constructor(private suitePageService: SuitePageService) {
    this._subItems = this.suitePageService.items$.subscribe((allItems) => {
      const perfs = allItems
        .filter((v) => v.type === SuitePageItemType.Batch)
        .map((v) => v.asBatch())
        .filter((v) => v.meta.metricsDurationHead)
        .slice(-50)
        .map((v) => ({
          slug: v.batchSlug,
          duration: v.meta.metricsDurationHead
        }));
      if (!isEqual(perfs, this.fields.perfs)) {
        this.fields.perfs = perfs;
      }
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subItems.unsubscribe();
  }
}
