// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';

import { SuitePageItemType } from './suite.model';
import { SuitePageService } from './suite.service';

type Fields = Partial<{
  perfs: {
    name: string;
    slug: string;
    duration: number;
  }[];
}>;

@Component({
  selector: 'app-suite-trends-runtime',
  templateUrl: './trends.component.html'
})
export class SuiteTrendsRuntimeComponent implements OnDestroy {
  fields: Fields = {
    perfs: []
  };

  private _subItems: Subscription;
  faInfoCircle = faInfoCircle;
  isTooltipActive = false;

  constructor(
    private suitePageService: SuitePageService,
    faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(faInfoCircle);
    this._subItems = this.suitePageService.items$.subscribe((allItems) => {
      const perfs = allItems
        .filter((v) => v.type === SuitePageItemType.Batch)
        .map((v) => v.asBatch())
        .filter((v) => v.meta.metricsDurationHead)
        .slice(-50)
        .map((v) => ({
          slug: v.batchSlug,
          name: v.batchSlug.split('@')[0],
          duration: v.meta.metricsDurationHead
        }));
      if (!isEqual(perfs, this.fields.perfs)) {
        this.fields.perfs = perfs;
      }
    });
  }

  ngOnDestroy() {
    this._subItems.unsubscribe();
  }
}
