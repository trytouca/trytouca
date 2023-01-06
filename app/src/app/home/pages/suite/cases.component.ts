// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ElementListResponseItem,
  SuiteLookupResponse
} from '@touca/api-schema';
import { Subscription } from 'rxjs';

import { ApiService, NotificationService } from '@/core/services';
import { PageListComponent } from '@/home/components';
import { FilterInput } from '@/home/models/filter.model';
import { AlertType } from '@/shared/components/alert.component';

import { SuitePageElement } from './suite.model';
import { SuitePageService } from './suite.service';

const filterInput: FilterInput<SuitePageElement> = {
  identifier: 'filter_suite_cases',
  filters: [
    {
      key: 'none',
      name: 'None',
      func: () => true
    }
  ],
  sorters: [
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => b.data.name.localeCompare(a.data.name)
    },
    {
      key: 'runtime',
      name: 'Runtime',
      func: (a, b) => b.data.metricsDuration - a.data.metricsDuration
    }
  ],
  searchBy: ['data.name'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'name',
    order: 'dsc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'tf',
    search: 'tq',
    sorter: 'ts',
    order: 'to',
    pagen: 'tn',
    pagel: 'tl'
  },
  placeholder: 'Find a test case'
};

@Component({
  selector: 'app-suite-tab-cases',
  templateUrl: './cases.component.html'
})
export class SuiteTabCasesComponent
  extends PageListComponent<SuitePageElement>
  implements OnDestroy
{
  suite: SuiteLookupResponse;

  private _subSuite: Subscription;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    suitePageService: SuitePageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, ['element'], route, router);
    this._subAllItems = suitePageService.data.elements$.subscribe((v) => {
      this.initCollections(v);
    });
    this._subSuite = suitePageService.data.suite$.subscribe((v) => {
      this.suite = v;
    });
  }

  ngOnDestroy() {
    this._subSuite.unsubscribe();
    super.ngOnDestroy();
  }

  updateMetadata(event: ElementListResponseItem) {
    const url = [
      'element',
      this.suite.teamSlug,
      this.suite.suiteSlug,
      event.slug
    ].join('/');
    this.apiService.patch(url, event).subscribe({
      error: () => {
        this.notificationService.notify(
          AlertType.Danger,
          'Something went wrong. Please try this operation again later.'
        );
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-suite-tab-cases');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
  }
}
