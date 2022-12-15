// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';
import { TopicType } from '@/home/models/page-item.model';

import { SuitePageItem } from './suite.model';
import { SuitePageService } from './suite.service';

const filterInput: FilterInput<SuitePageItem> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: () => true
    },
    {
      key: 'different',
      name: 'Different',
      func: (a) => {
        return (
          a.type === 'batch' && a.asBatch().meta.elementsScoreAggregate !== 1
        );
      }
    }
  ],
  sorters: [
    {
      key: 'date',
      name: 'Date',
      func: SuitePageItem.compareByDate
    }
  ],
  searchBy: ['searchKey'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'date',
    order: 'dsc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'f',
    search: 'q',
    sorter: 's',
    order: 'o',
    pagen: 'n',
    pagel: 'l'
  },
  placeholder: 'Find a version'
};

@Component({
  selector: 'app-suite-tab-batches',
  templateUrl: './list.component.html'
})
export class SuiteListBatchesComponent
  extends PageListComponent<SuitePageItem>
  implements OnDestroy
{
  chosenTopic: TopicType;

  constructor(
    suitePageService: SuitePageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, ['batch'], route, router);
    this._subAllItems = suitePageService.items$.subscribe((v) => {
      this.initCollections(v);
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-suite-tab-batches');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
    // pressing 'enter' when an item is selected should route to the next page
    if ('Enter' === event.key && row !== -1) {
      const item = this._items[row];
      if (item.type === 'batch') {
        const batch = item.asBatch();
        this.router.navigate([batch.batchSlug], {
          relativeTo: this.route,
          queryParams: {}
        });
      }
    }
  }

  updateChosenTopics(type: TopicType) {
    this.chosenTopic = type;
  }
}
