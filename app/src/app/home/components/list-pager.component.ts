/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { FilterParams, FilterStats } from '@weasel/home/models/filter.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

type PageNumber = {
  slug: number;
  tags: string[];
};

@Component({
  selector: 'app-home-list-pager',
  templateUrl: './list-pager.component.html'
})
export class ListPagerComponent {
  private _pagelSubject = new Subject<number>();
  private _pagenSubject = new Subject<number>();
  private _pagenQueryChanged = new Subject<KeyboardEvent>();

  @Input() params: FilterParams;
  @Input() stats: FilterStats;
  @Output() updateList = new EventEmitter<FilterParams>();

  /**
   *
   */
  constructor() {
    const update = () =>
      this.updateList.emit({
        pagel: this.params.pagel,
        pagen: this.params.pagen
      });
    this._pagelSubject.pipe(distinctUntilChanged()).subscribe((pagel) => {
      this.params.pagel = pagel;
      this.params.pagen = 1;
      update();
    });
    this._pagenSubject.pipe(distinctUntilChanged()).subscribe((pagen) => {
      this.params.pagen = pagen;
      update();
    });
    this._pagenQueryChanged
      .pipe(
        distinctUntilChanged(),
        map((event: any) => event.target.value),
        debounceTime(500)
      )
      .subscribe((pagen) => {
        if (!pagen || pagen < 1 || this.lastPageNumber < pagen) {
          return;
        }
        this.params.pagen = pagen;
        update();
      });
  }

  /**
   *
   */
  isFirstPage(): boolean {
    return this.params.pagen === 1;
  }

  /**
   * The use of `<=` instead of `===` is to hide the pager when list has no
   * row in which case `lastPageNumber` is 0 while `pagen` is 1. An empty
   * list can appear when a filter is applied that matches no row.
   */
  isLastPage(): boolean {
    return this.lastPageNumber <= this.params.pagen;
  }

  /**
   *
   */
  previousPage(): void {
    if (!this.isFirstPage()) {
      this._pagenSubject.next(this.params.pagen - 1);
    }
  }

  /**
   *
   */
  nextPage(): void {
    if (!this.isLastPage()) {
      this._pagenSubject.next(this.params.pagen + 1);
    }
  }

  /**
   *
   */
  get pageNumber(): number {
    return this.params.pagen;
  }

  /**
   *
   */
  set pageNumber(pageNumber: number) {
    this._pagenSubject.next(pageNumber);
  }

  /**
   *
   */
  get pageNumbers(): PageNumber[] {
    const count = Math.min(
      5,
      Math.floor(this.stats.totalUnpaginatedRows / this.params.pagel)
    );
    const cur = this.params.pagen;
    const last = this.lastPageNumber;
    if (!cur || !last) {
      return [];
    }
    let headLength = Math.min(cur - 1, Math.floor(count / 2));
    const tailLength = Math.min(
      last - cur,
      Math.max(count - headLength, Math.floor(count / 2))
    );
    headLength = count - tailLength;
    const head = Array(headLength)
      .fill(0)
      .map((_, idx) => cur - idx - 1)
      .reverse();
    const tail = Array(tailLength)
      .fill(0)
      .map((_, idx) => cur + idx + 1);
    const output = head.concat(tail).map((v) => ({ slug: v, tags: [] }));
    if (cur !== 1) {
      output[0] = { slug: 1, tags: [] };
    }
    if (cur !== last) {
      output[output.length - 1] = { slug: last, tags: ['Last Page'] };
    }
    return output;
  }

  /**
   *
   */
  get lastPageNumber(): number {
    return Math.ceil(this.stats.totalUnpaginatedRows / this.params.pagel);
  }

  /**
   *
   */
  get pageLength(): number {
    return this.params.pagel;
  }

  /**
   *
   */
  set pageLength(pageLength: number) {
    this._pagelSubject.next(pageLength);
  }

  /**
   *
   */
  get pageLengths(): number[] {
    return [10, 20, 50, 100, 200, 500].filter(
      (v) => v < this.stats.totalUnpaginatedRows && v !== this.pageLength
    );
  }

  /**
   *
   */
  onKeyupPageNumber(pageNumber: KeyboardEvent) {
    this._pagenQueryChanged.next(pageNumber);
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const hotKeys = ['j', 'k', 'Backspace', 'Enter', 'Escape'];
    if (hotKeys.includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }
}
