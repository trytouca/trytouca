// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { SuiteLookupResponse } from '@touca/api-schema';
import { Subscription } from 'rxjs';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';

import { ElementPageItemType, ElementPageMetric } from './element.model';
import { ElementPageService, ElementPageTabType } from './element.service';

const filterInput: FilterInput<ElementPageMetric> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: () => true
    },
    {
      key: 'faster',
      name: 'Faster',
      func: (a) =>
        a.data.src !== 0 && a.data.dst !== 0 && a.data.src < a.data.dst
    },
    {
      key: 'slower',
      name: 'Slower',
      func: (a) =>
        a.data.src !== 0 && a.data.dst !== 0 && a.data.dst < a.data.src
    }
  ],
  sorters: [
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => b.data.name.localeCompare(a.data.name)
    },
    {
      key: 'duration',
      name: 'Duration',
      func: (a, b) => b.data.src - a.data.src
    },
    {
      key: 'change',
      name: 'Change',
      func: (a, b) => b.data.duration() - a.data.duration()
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
    filter: 'mf',
    search: 'mq',
    sorter: 'ms',
    order: 'mo',
    pagen: 'mn',
    pagel: 'ml'
  },
  placeholder: 'Find a metric'
};

@Component({
  selector: 'app-element-tab-metrics',
  templateUrl: './metrics.component.html'
})
export class ElementListMetricsComponent
  extends PageListComponent<ElementPageMetric>
  implements OnDestroy
{
  suite: SuiteLookupResponse;
  params: FrontendElementCompareParams;
  ItemType = ElementPageItemType;
  TabType = ElementPageTabType;

  private _subSuite: Subscription;
  private _subParams: Subscription;

  constructor(
    elementPageService: ElementPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, Object.values(ElementPageItemType), route, router);
    this._subAllItems = elementPageService.allMetricKeys$.subscribe((v) => {
      this.initCollections(v);
    });
    this._subSuite = elementPageService.suite$.subscribe((v) => {
      this.suite = v;
    });
    this._subParams = elementPageService.params$.subscribe((v) => {
      this.params = v;
    });
  }

  ngOnDestroy() {
    this._subSuite.unsubscribe();
    this._subParams.unsubscribe();
    super.ngOnDestroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-element-tab-metrics');
      return;
    }
  }
}
