/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ParamMap } from '@angular/router';

import Fuse from 'fuse.js';
import { cloneDeep } from 'lodash-es';

export type FilterFunction<T> = (a: T) => number | boolean;
export type SorterFunction<T> = (a: T, b: T) => number;

type InputItem = {
  key: string;
  name: string;
};

interface FilterInputItem<T> extends InputItem {
  func: FilterFunction<T>;
}
interface SorterInputItem<T> extends InputItem {
  func: SorterFunction<T>;
}

type Params<T> = {
  filter?: string;
  search?: string;
  sorter?: string;
  order?: string;
  pagen?: T;
  pagel?: T;
};

export type FilterInput<T> = {
  filters: FilterInputItem<T>[];
  sorters: SorterInputItem<T>[];
  searchBy: string[];
  defaults: Required<Params<number>>;
  queryKeys: Required<Params<string>>;
  placeholder: string;
};

export type FilterParams = Params<number>;

export type FilterStats = {
  totalUnpaginatedRows: number;
  totalRows: number;
};

/**
 *
 */
export class FilterManager<T> {
  /**
   *
   */
  constructor(private readonly input: FilterInput<T>) {}

  /**
   *
   */
  private getFilter(key: string): FilterInputItem<T> {
    const findItem = (k: string) =>
      this.input.filters.find((v) => v.key.localeCompare(k) === 0);
    return findItem(key) || findItem(this.input.defaults.filter);
  }

  /**
   *
   */
  private getSorter(key: string): SorterInputItem<T> {
    const findItem = (k: string) =>
      this.input.sorters.find((v) => v.key.localeCompare(k) === 0);
    return findItem(key) || findItem(this.input.defaults.sorter);
  }

  /**
   *
   */
  public parseQueryMap(queryMap: ParamMap): FilterParams {
    const qFilter = queryMap.get(this.input.queryKeys.filter);
    const qSearch = queryMap.get(this.input.queryKeys.search);
    const qSorter = queryMap.get(this.input.queryKeys.sorter);
    const qOrder = queryMap.get(this.input.queryKeys.order);
    const qPagen = queryMap.get(this.input.queryKeys.pagen);
    const qPagel = queryMap.get(this.input.queryKeys.pagel);

    const filter = this.getFilter(qFilter).key;
    const sorter = this.getSorter(qSorter).key;
    const order = ['asc', 'dsc'].includes(qOrder)
      ? qOrder
      : this.input.defaults.order;
    const search = qSearch || this.input.defaults.search;
    const pagen =
      qPagen && !isNaN(+qPagen) ? +qPagen : this.input.defaults.pagen;
    const pagel =
      qPagel && !isNaN(+qPagel) ? +qPagel : this.input.defaults.pagel;

    return { filter, search, sorter, order, pagen, pagel };
  }

  /**
   *
   */
  public buildQueryMap(event: FilterParams): Params<string> {
    const getKey = (key: string): string => this.input.queryKeys[key];
    const getValue = (key: string): any => {
      return key in event && event[key] !== this.input.defaults[key]
        ? event[key]
        : null;
    };
    return {
      [getKey('filter')]: getValue('filter'),
      [getKey('search')]: getValue('search'),
      [getKey('sorter')]: getValue('sorter'),
      [getKey('order')]: getValue('order'),
      [getKey('pagen')]: getValue('pagen'),
      [getKey('pagel')]: getValue('pagel')
    };
  }

  /**
   *
   */
  public filterSortPage(items: ReadonlyArray<T>, event: FilterParams): T[] {
    const opts: Fuse.IFuseOptions<T> = {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 100,
      minMatchCharLength: 1,
      keys: this.input.searchBy
    };
    let output = cloneDeep(items) as T[];
    if (event.filter) {
      output = items.filter(this.getFilter(event.filter).func);
    }
    if (event.search && event.search !== this.input.defaults.search) {
      const fuse = new Fuse(output, opts);
      const result = fuse.search(event.search);
      output = result.map((v) => v.item) as T[];
    }
    if (event.sorter) {
      output.sort(this.getSorter(event.sorter).func);
    }
    if (event.order !== this.input.defaults.order) {
      output.reverse();
    }
    return output;
  }

  /**
   *
   */
  public paginate(items: T[], event: FilterParams): T[] {
    if (event.pagel && event.pagen) {
      const start = Math.max(0, (event.pagen - 1) * event.pagel);
      const end = Math.min(start + event.pagel, items.length);
      return items.slice(start, end);
    }
    return items;
  }

  /**
   *
   */
  get filters(): { key: string; name: string }[] {
    return this.input.filters.map((v) => ({ key: v.key, name: v.name }));
  }

  /**
   *
   */
  get sorters(): { key: string; name: string }[] {
    return this.input.sorters.map((v) => ({ key: v.key, name: v.name }));
  }

  /**
   *
   */
  get defaults(): Required<Params<number>> {
    return this.input.defaults;
  }

  /**
   *
   */
  get placeholder(): string {
    return this.input.placeholder;
  }
}
