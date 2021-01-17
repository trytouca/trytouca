/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, EventEmitter, HostListener, Output, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faSortAmountDown, faSortAmountDownAlt } from '@fortawesome/free-solid-svg-icons';
import { FilterManager, FilterParams, FilterStats } from '@weasel/home/models/filter.model';

@Component({
  selector: 'app-home-list-filter',
  templateUrl: './list-filter.component.html',
  styleUrls: ['./list-filter.component.scss']
})
export class ListFilterComponent {

  private _filterSubject = new Subject<string>();
  private _searchSubject = new Subject<string>();
  private _sorterSubject = new Subject<string>();
  private _orderSubject = new Subject<string>();

  @Input() manager: FilterManager<unknown>;
  @Input() params: FilterParams;
  @Input() stats: FilterStats;
  @Output() updateList = new EventEmitter<FilterParams>();

  /**
   *
   */
  constructor(
    private faIconLibrary: FaIconLibrary,
  ) {
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
    this._searchSubject
        .pipe(
          map(res => res.length < 3 ? '' : res),
          debounceTime(500),
          distinctUntilChanged()
        ).subscribe((text) => {
          this.params.search = text;
          updateFilter();
        });
    this._filterSubject
        .pipe(distinctUntilChanged())
        .subscribe((text) => {
          this.params.filter = text;
          updateFilter();
        });
    this._sorterSubject
        .pipe(distinctUntilChanged())
        .subscribe((text) => {
          this.params.sorter = text;
          updateSortParams();
        });
    this._orderSubject
        .pipe(distinctUntilChanged())
        .subscribe((text) => {
          this.params.order = text;
          updateSortParams();
        });
    faIconLibrary.addIcons(faSortAmountDown, faSortAmountDownAlt);
  }

  /**
   *
   */
  onKeyupRowFilter(event) {
    this._searchSubject.next(event.target.value);
  }

  /**
   *
   */
  public isSearchActive(): boolean {
    return 2 < this.params.search.length;
  }

  /**
   *
   */
  get filters(): { key: string, name: string }[] {
    return this.manager.filters;
  }

  /**
   *
   */
  get sorters(): { key: string, name: string }[] {
    return this.manager.sorters;
  }

  /**
   *
   */
  get filterQueryPlaceholder(): string {
    return this.manager.placeholder;
  }

  /**
   *
   */
  get filterQueryValue(): string {
    return this.params.search;
  }

  /**
   *
   */
  get filterName(): string {
    return this.manager.filters
      .find(v => v.key.localeCompare(this.params.filter) === 0)
      .name;
  }

  /**
   *
   */
  set filterName(filterName: string) {
    this._filterSubject.next(filterName);
  }

  /**
   *
   */
  get sorterName(): string {
    if (this.isSearchActive()) {
      return 'Relevance';
    }
    return this.manager.sorters
      .find(v => v.key.localeCompare(this.params.sorter) === 0)
      .name;
  }

  /**
   *
   */
  set sorterName(sorterName: string) {
    this._sorterSubject.next(sorterName);
  }

  /**
   *
   */
  sortOrderToggle(): void {
    this._orderSubject.next(this.params.order === 'dsc' ? 'asc' : 'dsc');
  }

  /**
   *
   */
  get sortOrderIcon(): string {
    return this.params.order === 'asc' ? 'sort-amount-down-alt' : 'sort-amount-down';
  }

  /**
   *
   */
  clearFilters() {
    if (this.params.search) {
      this._searchSubject.next(this.manager.defaults.search);
    }
    if (this.params.filter !== this.manager.defaults.filter) {
      this._filterSubject.next(this.manager.defaults.filter);
    }
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (['j', 'k', 'c', 'Enter', 'Escape', 'Backspace'].includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }

}
