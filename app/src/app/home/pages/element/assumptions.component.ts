// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  Component,
  HostListener,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SuiteLookupResponse } from '@touca/api-schema';
import { Subscription } from 'rxjs';

import { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';

import { ElementPageResult } from './element.model';
import { ElementPageService } from './element.service';
import { ElementItemResultComponent } from './result.component';

const filterInput: FilterInput<ElementPageResult> = {
  identifier: 'filter_element_assumptions',
  filters: [
    {
      key: 'none',
      name: 'None',
      func: () => true
    },
    {
      key: 'different',
      name: 'Different',
      func: (a) => a.data.score !== 1
    }
  ],
  sorters: [
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => b.data.name.localeCompare(a.data.name)
    },
    {
      key: 'score',
      name: 'Match Rate',
      func: (a, b) => {
        if (!a.data.score) {
          return 1;
        }
        if (!b.data.score) {
          return -1;
        }
        return a.data.score - b.data.score;
      }
    }
  ],
  searchBy: ['data.name'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'score',
    order: 'asc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'rf',
    search: 'rq',
    sorter: 'rs',
    order: 'ro',
    pagen: 'rn',
    pagel: 'rl'
  },
  placeholder: 'Find an assumption'
};

@Component({
  selector: 'app-element-tab-assumptions',
  templateUrl: './results.component.html',
  styles: []
})
export class ElementListAssumptionsComponent
  extends PageListComponent<ElementPageResult>
  implements OnDestroy
{
  data: Partial<{
    suite: SuiteLookupResponse;
    params: FrontendElementCompareParams;
  }> = {};

  private subscriptions: Record<'params' | 'suite', Subscription>;
  readonly tabId = 'wsl-element-tab-assumptions';
  @ViewChildren(ElementItemResultComponent)
  resultRows: QueryList<ElementItemResultComponent>;

  constructor(
    elementPageService: ElementPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, ['common', 'fresh', 'missing'], route, router);
    this._subAllItems = elementPageService.data.allAssumptions$.subscribe(
      (v) => {
        this.initCollections(v);
      }
    );
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
      super.keyboardNavigateList(event, '#'.concat(this.tabId));
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
    // pressing 'v' when a key is selected should expand/collapse its details
    if ('v' === event.key && this.selectedRow !== -1) {
      this.resultRows.toArray()[this.selectedRow].toggleComplexView();
    }
  }
}
