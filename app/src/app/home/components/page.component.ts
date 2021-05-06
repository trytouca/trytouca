/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { timer } from 'rxjs';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { environment } from 'src/environments/environment';
import { IPageService } from '@weasel/home/models/pages.model';

export type PageTab<TabType> = {
  type: TabType;
  name: string;
  link: string;
  icon: IconProp;
  shown: boolean;
  counter?: number;
};

@Component({
  template: ''
})
export abstract class PageComponent<PageItemType, TabType, NotFound>
  implements OnInit, OnDestroy {
  private _alive = true;
  private _interval = environment.dataRefreshInterval;
  protected _notFound: Partial<NotFound> = {};
  public currentTab: TabType;

  /**
   *
   */
  constructor(
    protected pageService: IPageService<PageItemType>,
    @Inject('PAGE_TABS') public tabs: PageTab<TabType>[],
    protected route: ActivatedRoute
  ) {
    const queryMap = this.route.snapshot.queryParamMap;
    const getQuery = (key: string) =>
      queryMap.has(key) ? queryMap.get(key) : null;
    const tab = this.tabs.find((v) => v.link === getQuery('t')) || this.tabs[0];
    this.currentTab = tab.type;
  }

  /**
   *
   */
  ngOnInit() {
    timer(0, this._interval)
      .pipe(takeWhile(() => this._alive && !this.notFound()))
      .subscribe(() => {
        this.fetchItems();
      });
  }

  /**
   *
   */
  ngOnDestroy() {
    this._alive = false;
  }

  /**
   *
   */
  abstract fetchItems(): void;

  /**
   *
   */
  public hasData() {
    return this.pageService.hasData();
  }

  /**
   *
   */
  public hasItems() {
    return this.pageService.countItems() !== 0;
  }

  /**
   *
   */
  public notFound(): Partial<NotFound> | null {
    if (Object.keys(this._notFound).length) {
      return this._notFound;
    }
  }

  /**
   *
   */
  public switchTab(type: TabType) {
    this.currentTab = type;
    if (!this.hasData()) {
      this.fetchItems();
    }
  }
}
