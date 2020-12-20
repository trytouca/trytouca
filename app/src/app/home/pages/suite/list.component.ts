/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageListComponent } from 'src/app/home/components/page-list.component';
import { FilterInput } from 'src/app/home/models/filter.model';
import { SuitePageService } from './suite.service';
import { SuitePageItem, SuitePageItemType } from './suite.model';

const filterInput: FilterInput<SuitePageItem> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: (a) => true,
    },
    {
      key: 'versions',
      name: 'Versions',
      func: a => a.type === SuitePageItemType.Batch
    },
    {
      key: 'different',
      name: 'Different',
      func: a => {
        return a.type === SuitePageItemType.Batch
          && a.asBatch().meta.elementsScoreAggregate !== 1;
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
export class SuiteListBatchesComponent extends PageListComponent<SuitePageItem> implements OnDestroy {

  ItemType = SuitePageItemType;

  /**
   *
   */
  constructor(
    private suitePageService: SuitePageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, Object.values(SuitePageItemType), route, router);
    this._subAllItems = this.suitePageService.items$.subscribe(allItems => {
      this.initCollections(allItems);
    });
  }

  /**
   *
   */
  getListItems(): SuitePageItem[] {
    const batches = this.getShownRows(SuitePageItemType.Batch) || [];
    const promotions = this.getShownRows(SuitePageItemType.Promotion) || [];
    const items = batches.concat(promotions);
    items.sort(SuitePageItem.compareByDate);
    return items;
  }

  /**
   *
   */
  ngOnDestroy() {
    super.ngOnDestroy();
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-suite-batches');
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
      if (item.type === SuitePageItemType.Batch) {
        const batch = item.asBatch();
        this.router.navigate([ batch.batchSlug ],
          { relativeTo: this.route, queryParams: {} });
      }
    }
  }

}
