// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';

import {
  FilterInput,
  FilterManager,
  FilterParams,
  FilterStats
} from '@/home/models/filter.model';

type CollectionType = string;

@Component({
  template: ''
})
export class PageListComponent<ItemType> implements OnDestroy {
  /* list of all items as obtained from backend */
  protected _allItems: ItemType[] = [];

  protected _subAllItems: Subscription;

  /* number of items in each category before filtering and pagination */
  protected _allItemsCounter = new Map<CollectionType, number>();

  /* list of items to be displayed */
  protected _items: ItemType[] = [];

  protected _itemsCache: ItemType[];

  /* list of items to be displayed, categorized by type */
  protected _collections = new Map<CollectionType, ItemType[]>();

  /* number of items before pagination, categorized by type */
  protected _unpaginatedCounter = new Map<CollectionType, number>();

  /* index of row in focus */
  public selectedRow = -1;

  /* helper class for filtering, sorting and paging items */
  public filterManager: FilterManager<ItemType>;

  private _params: FilterParams = {};

  /**
   *
   */
  constructor(
    @Inject('FILTER_INPUT') filterInput: FilterInput<ItemType>,
    @Inject('COLLECTION_KEYS') private collectionKeys: CollectionType[],
    protected route: ActivatedRoute,
    protected router: Router
  ) {
    this.filterManager = new FilterManager<ItemType>(filterInput);
  }

  /**
   *
   */
  ngOnDestroy() {
    if (this._subAllItems) {
      this._subAllItems.unsubscribe();
    }
  }

  /**
   *
   */
  countRows(type: CollectionType): number {
    return this._allItemsCounter.get(type);
  }

  /**
   *
   */
  countShownRows(type: CollectionType): number {
    return this._collections.has(type) ? this._collections.get(type).length : 0;
  }

  /**
   *
   */
  getShownRows(type: CollectionType): ItemType[] {
    return this._collections.get(type);
  }

  /**
   *
   */
  protected initCollections(allItems: ItemType[]) {
    const queryMap = this.route.snapshot.queryParamMap;
    this._allItems = allItems;
    for (const type of this.collectionKeys) {
      this._allItemsCounter.set(
        type,
        allItems.filter((v: any) => v.type === type).length
      );
    }
    this._params = this.filterManager.parseQueryMap(queryMap);
    this.updateCollections();
  }

  /**
   *
   */
  public updateList(params: FilterParams) {
    Object.assign(this._params, params);
    this.updateCollections();
    this.updateRouter();
    // clear selected row since it is no longer valid
    this.selectedRow = -1;
  }

  /**
   *
   */
  private updateCollections() {
    const items = this.filterManager.filterSortPage(
      this._allItems,
      this._params
    );
    for (const type of this.collectionKeys) {
      this._unpaginatedCounter.set(
        type,
        items.filter((v: any) => v.type === type).length
      );
    }
    this._items = this.filterManager.paginate(items, this._params);
    const isCacheValid = isEqual(this._itemsCache, this._items);
    if (isCacheValid && this._collections) {
      return;
    }
    for (const type of this.collectionKeys) {
      this._collections.set(
        type,
        this._items.filter((v: any) => v.type === type)
      );
    }
    this._itemsCache = this._items;
  }

  /**
   *
   */
  private updateRouter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.filterManager.buildQueryMap(this._params),
      queryParamsHandling: 'merge'
    });
  }

  /**
   *
   */
  public filterParams(): FilterParams {
    const defaults = this.filterManager.defaults;
    const queries = this.route.snapshot.queryParamMap;
    const params = this.filterManager.parseQueryMap(queries);
    return {
      filter: params.filter || defaults.filter,
      search: params.search || defaults.search,
      sorter: params.sorter || defaults.sorter,
      order: params.order || defaults.order
    };
  }

  /**
   *
   */
  public pagerParams(): FilterParams {
    const defaults = this.filterManager.defaults;
    const queries = this.route.snapshot.queryParamMap;
    const params = this.filterManager.parseQueryMap(queries);
    return {
      pagel: params.pagel || defaults.pagel,
      pagen: params.pagen || defaults.pagen
    };
  }

  /**
   *
   */
  public filterStats(): FilterStats {
    const totalRows = this.collectionKeys
      .map((v) => this._allItemsCounter.get(v))
      .filter((v) => v)
      .reduce((prev, v) => prev + v, 0);
    const totalUnpaginatedRows = this.collectionKeys
      .map((v) => this._unpaginatedCounter.get(v))
      .filter((v) => v)
      .reduce((prev, v) => prev + v, 0);
    return { totalRows, totalUnpaginatedRows };
  }

  /**
   *
   */
  keyboardNavigateList(event: KeyboardEvent, listId: string) {
    if (!['j', 'k'].includes(event.key)) {
      return;
    }
    const allRows = document.querySelector(listId);
    if (!allRows) {
      return;
    }
    let row = this.selectedRow;
    const rows = allRows.querySelectorAll('.wsl-list-item-outer');
    if (rows.length === 0) {
      return;
    }
    if (event.key === 'j' && row < rows.length - 1) {
      row++;
    }
    if (event.key === 'k' && 0 < row) {
      row--;
    }
    // in special case when no row is selected,
    // pressing `k` should select the first row
    if (event.key === 'k' && row === -1) {
      row = 0;
    }
    // update the selected row
    this.selectedRow = row;
    // smoothly scroll to the selected row
    rows[row].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
