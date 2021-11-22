// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { timer } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { IPageService } from '@/home/models/pages.model';

export type PageTab<TabType> = {
  type: TabType;
  name: string;
  link: string;
  icon: string;
  shown: boolean;
  counter?: number;
};

@Component({ template: '' })
export abstract class PageComponent<PageItemType, NotFound>
  implements OnInit, OnDestroy
{
  private _alive = true;
  private _interval = environment.dataRefreshInterval;
  protected _notFound: Partial<NotFound> = {};

  constructor(protected pageService: IPageService<PageItemType>) {}

  ngOnInit() {
    timer(0, this._interval)
      .pipe(takeWhile(() => this._alive && !this.notFound()))
      .subscribe(() => {
        this.fetchItems();
      });
  }

  ngOnDestroy() {
    this._alive = false;
  }

  abstract fetchItems(): void;

  public hasData() {
    return this.pageService.hasData();
  }

  public hasItems() {
    return this.pageService.countItems() !== 0;
  }

  public notFound(): Partial<NotFound> | null {
    if (Object.keys(this._notFound).length) {
      return this._notFound;
    }
  }
}
