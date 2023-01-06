// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faSortAmountDown,
  faSortAmountDownAlt
} from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import {
  FilterManager,
  FilterParams,
  FilterStats
} from '@/home/models/filter.model';

@Component({
  selector: 'app-home-list-filter',
  templateUrl: './list-filter.component.html'
})
export class ListFilterComponent {
  filters: { key: string; name: string }[] = [];
  sorters: { key: string; name: string }[] = [];
  private _manager: FilterManager<unknown>;
  private subjects = {
    filter: new Subject<FilterParams['filter']>(),
    search: new Subject<FilterParams['search']>(),
    sorter: new Subject<FilterParams['sorter']>(),
    order: new Subject<FilterParams['order']>()
  };

  @Input() set manager(v: FilterManager<unknown>) {
    if (v !== this._manager) {
      this._manager = v;
      this.filters = this._manager.filters;
      this.sorters = this._manager.sorters;
    }
  }
  @Input() params: FilterParams;
  @Input() stats: FilterStats;
  @Output() updateList = new EventEmitter<FilterParams>();

  constructor(faIconLibrary: FaIconLibrary) {
    const updateFilter = () => {
      this.updateList.emit({
        filter: this.params.filter,
        search: this.params.search,
        sorter: this.params.sorter,
        order: this.params.order,
        pagen: 1
      });
    };
    const updateSortParams = () => {
      this.updateList.emit({
        sorter: this.params.sorter,
        order: this.params.order
      });
    };
    this.subjects.search
      .pipe(
        map((res) => (res.length < 3 ? '' : res)),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((text) => {
        this.params.search = text;
        updateFilter();
      });
    this.subjects.filter.pipe(distinctUntilChanged()).subscribe((text) => {
      this.params.filter = text;
      updateFilter();
    });
    this.subjects.sorter.pipe(distinctUntilChanged()).subscribe((text) => {
      this.params.sorter = text;
      updateSortParams();
    });
    this.subjects.order.pipe(distinctUntilChanged()).subscribe((text) => {
      this.params.order = text;
      updateSortParams();
    });
    faIconLibrary.addIcons(faSortAmountDown, faSortAmountDownAlt);
  }

  onKeyupRowFilter(event) {
    this.subjects.search.next(event.target.value as string);
  }

  public isSearchActive(): boolean {
    return 2 < this.params.search.length;
  }

  get filterQueryPlaceholder(): string {
    return this._manager.placeholder;
  }

  get filterQueryValue(): string {
    return this.params.search;
  }

  get filterName(): string {
    return this._manager.filters.find(
      (v) => v.key.localeCompare(this.params.filter) === 0
    ).name;
  }

  set filterName(filterName: string) {
    this.subjects.filter.next(filterName);
  }

  get sorterName(): string {
    if (this.isSearchActive()) {
      return 'Relevance';
    }
    return this._manager.sorters.find(
      (v) => v.key.localeCompare(this.params.sorter) === 0
    ).name;
  }

  set sorterName(sorterName: string) {
    this.subjects.sorter.next(sorterName);
  }

  sortOrderToggle(): void {
    this.subjects.order.next(this.params.order === 'dsc' ? 'asc' : 'dsc');
  }

  get sortOrderIcon(): IconProp {
    return this.params.order === 'asc'
      ? 'sort-amount-down-alt'
      : 'sort-amount-down';
  }

  hasDirtyFilters() {
    return ['search', 'filter', 'sorter', 'order'].some(
      (k: keyof FilterParams) => this.params[k] !== this._manager.defaults[k]
    );
  }

  clearFilters() {
    ['search', 'filter', 'sorter', 'order'].forEach(
      (key: keyof Omit<FilterParams, 'pagen' | 'pagel'>) => {
        if (this.params[key] !== this._manager.defaults[key]) {
          this.subjects[key].next(this._manager.defaults[key]);
        }
      }
    );
  }

  get bottomView() {
    return this.stats.totalUnpaginatedRows === 0
      ? 'full'
      : this.stats.totalRows - this.stats.totalUnpaginatedRows
      ? 'clear'
      : this.hasDirtyFilters()
      ? 'reset'
      : 'none';
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (['j', 'k', 'c', 'Enter', 'Escape', 'Backspace'].includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }
}
