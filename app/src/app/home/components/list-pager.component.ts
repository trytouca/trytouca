// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { FilterParams, FilterStats } from '@/home/models/filter.model';

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
  private _parameters: FilterParams;
  private _statistics: FilterStats;

  data: {
    pageNumbers: PageNumber[];
  } = {
    pageNumbers: []
  };

  @Input()
  set params(input: FilterParams) {
    this._parameters = input;
  }

  @Input()
  set stats(input: FilterStats) {
    this._statistics = input;
  }

  @Output() updateList = new EventEmitter<FilterParams>();

  constructor() {
    const update = () => {
      this.updateList.emit({
        pagel: this._parameters.pagel,
        pagen: this._parameters.pagen
      });
      this.data = {
        pageNumbers: this.findPageNumberList()
      };
    };
    this._pagelSubject.pipe(distinctUntilChanged()).subscribe((pagel) => {
      this._parameters.pagel = pagel;
      this._parameters.pagen = 1;
      update();
    });
    this._pagenSubject.pipe(distinctUntilChanged()).subscribe((pagen) => {
      this._parameters.pagen = pagen;
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
        this._parameters.pagen = pagen;
        update();
      });
  }

  isFirstPage(): boolean {
    return this._parameters.pagen === 1;
  }

  /**
   * The use of `<=` instead of `===` is to hide the pager when list has no
   * row in which case `lastPageNumber` is 0 while `pagen` is 1. An empty
   * list can appear when a filter is applied that matches no row.
   */
  isLastPage(): boolean {
    return this.lastPageNumber <= this._parameters.pagen;
  }

  previousPage(): void {
    if (!this.isFirstPage()) {
      this._pagenSubject.next(this._parameters.pagen - 1);
    }
  }

  nextPage(): void {
    if (!this.isLastPage()) {
      this._pagenSubject.next(this._parameters.pagen + 1);
    }
  }

  get pageNumber(): number {
    return this._parameters.pagen;
  }

  set pageNumber(pageNumber: number) {
    this._pagenSubject.next(pageNumber);
  }

  private findPageNumberList(): PageNumber[] {
    if (!this._statistics) {
      return;
    }
    const count = Math.min(
      5,
      Math.floor(this._statistics.totalUnpaginatedRows / this._parameters.pagel)
    );
    const cur = this._parameters.pagen;
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

  get lastPageNumber(): number {
    return Math.ceil(
      this._statistics.totalUnpaginatedRows / this._parameters.pagel
    );
  }

  get pageLength(): number {
    return this._parameters.pagel;
  }

  set pageLength(pageLength: number) {
    this._pagelSubject.next(pageLength);
  }

  get pageLengths(): number[] {
    return [10, 20, 50, 100, 200, 500].filter(
      (v) => v < this._statistics.totalUnpaginatedRows && v !== this.pageLength
    );
  }

  onKeyupPageNumber(pageNumber: KeyboardEvent) {
    this._pagenQueryChanged.next(pageNumber);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    const hotKeys = ['j', 'k', 'Backspace', 'Enter', 'Escape'];
    if (hotKeys.includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }
}
