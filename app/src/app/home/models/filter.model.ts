// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { ParamMap } from '@angular/router';
import Fuse from 'fuse.js';
import { cloneDeep } from 'lodash-es';

import { ELocalStorageKey } from '@/core/models/frontendtypes';

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
  identifier: string;
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

export class FilterManager<T> {
  constructor(private readonly input: FilterInput<T>) {}

  private getFilter(key: string): FilterInputItem<T> {
    const findItem = (k: string) =>
      this.input.filters.find((v) => v.key.localeCompare(k) === 0);
    return findItem(key) || findItem(this.input.defaults.filter);
  }

  private getSorter(key: string): SorterInputItem<T> {
    const findItem = (k: string) =>
      this.input.sorters.find((v) => v.key.localeCompare(k) === 0);
    return findItem(key) || findItem(this.input.defaults.sorter);
  }

  public parseQueryMap(queryMap: ParamMap): FilterParams {
    const isValid: Record<keyof FilterParams, (x: string) => boolean> = {
      filter: (x) =>
        this.input.filters.some((v) => v.key.localeCompare(x) === 0),
      sorter: (x) =>
        this.input.sorters.some((v) => v.key.localeCompare(x) === 0),
      order: (x) => ['asc', 'dsc'].includes(x),
      search: (x) => !!x,
      pagen: (x) => x && !isNaN(+x),
      pagel: (x) => x && !isNaN(+x)
    };
    return Object.fromEntries(
      Object.keys(isValid).map((k: keyof FilterParams) => {
        const query = queryMap.get(this.input.queryKeys[k]);
        const toValue = (x) => (['pagen', 'pagel'].includes(k) ? +x : x);
        return [k, isValid[k](query) ? toValue(query) : this.input.defaults[k]];
      })
    );
  }

  public buildQueryMap(params: FilterParams): Params<string> {
    return Object.fromEntries(
      ['filter', 'search', 'sorter', 'order', 'pagen', 'pagel'].map((k) => [
        this.input.queryKeys[k],
        k in params && params[k] !== this.input.defaults[k]
          ? params[k]
          : undefined
      ])
    );
  }

  public parseLocalStorage(): Params<string> {
    const preferences = JSON.parse(
      localStorage.getItem(ELocalStorageKey.Preferences) || '{}'
    );
    const filter: Record<string, unknown> =
      this.input.identifier in preferences
        ? preferences[this.input.identifier]
        : {};
    return Object.fromEntries(
      Object.entries(filter).map(([k, v]) => [this.input.queryKeys[k], v])
    );
  }

  public updateLocalStorage(p: FilterParams): void {
    const filter = Object.fromEntries(
      ['filter', 'search', 'sorter', 'order'].map((x) => [
        x,
        x in p && p[x] !== this.input.defaults[x] ? p[x] : undefined
      ])
    );
    const preferences = JSON.parse(
      localStorage.getItem(ELocalStorageKey.Preferences) || '{}'
    );
    preferences[this.input.identifier] = filter;
    localStorage.setItem(
      ELocalStorageKey.Preferences,
      JSON.stringify(preferences)
    );
  }

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
      output = result.map((v) => v.item);
    }
    if (event.sorter) {
      output.sort(this.getSorter(event.sorter).func);
    }
    if (event.order !== this.input.defaults.order) {
      output.reverse();
    }
    return output;
  }

  public paginate(items: T[], event: FilterParams): T[] {
    if (event.pagel && event.pagen) {
      const start = Math.max(0, (event.pagen - 1) * event.pagel);
      const end = Math.min(start + event.pagel, items.length);
      return items.slice(start, end);
    }
    return items;
  }

  get filters(): { key: string; name: string }[] {
    return this.input.filters.map((v) => ({ key: v.key, name: v.name }));
  }

  get sorters(): { key: string; name: string }[] {
    return this.input.sorters.map((v) => ({ key: v.key, name: v.name }));
  }

  get defaults(): Required<Params<number>> {
    return this.input.defaults;
  }

  get placeholder(): string {
    return this.input.placeholder;
  }
}
