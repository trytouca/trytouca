// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { SuiteLookupResponse } from '@touca/api-schema';
import { Subscription } from 'rxjs';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';

import { ElementPageMetric } from './element.model';
import { ElementPageService } from './element.service';

const filterInput: FilterInput<ElementPageMetric> = {
  identifier: 'filter_element_metrics',
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
  data: Partial<{
    suite: SuiteLookupResponse;
    params: FrontendElementCompareParams;
  }> = {};

  private subscriptions: Record<'params' | 'suite', Subscription>;

  constructor(
    elementPageService: ElementPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, ['common', 'fresh', 'missing'], route, router);
    this._subAllItems = elementPageService.data.allMetrics$.subscribe((v) => {
      this.initCollections(v);
    });
    this.subscriptions = {
      suite: elementPageService.data.suite$.subscribe((v) => {
        this.data.suite = v;
      }),
      params: elementPageService.data.params$.subscribe((v) => {
        this.data.params = v;
      })
    };
  }

  ngOnDestroy() {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
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
