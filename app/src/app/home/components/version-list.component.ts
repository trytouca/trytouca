/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Fuse from 'fuse.js';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, skip } from 'rxjs/operators';
import { isEqual } from 'lodash-es';
import type { FrontendElementCompareParams } from 'src/app/core/models/frontendtypes';
import { SuiteLookupResponse } from 'src/app/core/models/commontypes';

type Version = {
  slug: string;
  tags: string[];
};

@Component({
  selector: 'app-home-version-list',
  templateUrl: './version-list.component.html',
  styleUrls: ['./version-list.component.scss']
})
export class VersionListComponent implements OnChanges {

  @Input() suite: SuiteLookupResponse;
  @Input() params: FrontendElementCompareParams;
  @Input() side: 'head' | 'base';

  private _dstBatchChanged = new Subject<string>();
  private _srcBatchChanged = new Subject<string>();

  private _versionQuery = '';
  private _relevantVersions: Version[] = [];
  private _versionQueryChanged: Subject<string> = new Subject<string>();
  private _searchOptions: Fuse.IFuseOptions<string> = {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    minMatchCharLength: 1
  };

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this._dstBatchChanged
      .pipe(distinctUntilChanged(), skip(1))
      .subscribe((version) => {
        this.params.dstBatchSlug = version;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { cv: version },
          queryParamsHandling: 'merge'
        });
      });
    this._srcBatchChanged
      .pipe(distinctUntilChanged(), skip(1))
      .subscribe((version) => {
        this.params.srcBatchSlug = version;
        if (this.params.srcElementSlug === undefined) {
          this.router.navigate(['..', version], {
            relativeTo: this.route
          });
        } else {
          this.router.navigate(['~', this.params.teamSlug, this.params.srcSuiteSlug, version, this.params.srcElementSlug], {
            queryParamsHandling: 'merge'
          });
        }
      });
    this._versionQueryChanged
      .pipe(
        map((event: any) => event.target.value),
        map(res => res.length < 2 ? '' : res),
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe((text) => {
        this._versionQuery = text;
        this.refreshVersionList();
      });
  }

  /**
   *
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!this.params || !this.suite) {
      return;
    }
    this._dstBatchChanged.next(this.params.dstBatchSlug);
    this._srcBatchChanged.next(this.params.srcBatchSlug);
    const mc = changes.suite;
    if (mc) {
      const cr = mc.currentValue;
      const pr = mc.previousValue;
      if (mc.firstChange || !isEqual(cr, pr)) {
        this.refreshVersionList();
      }
    }
  }

  /**
   *
   */
  refreshVersionList() {
    let versions: string[] = [];
    if (this._versionQuery.length !== 0) {
      const fuse = new Fuse(this.suite.batches, this._searchOptions);
      const result = fuse.search(this._versionQuery);
      versions = result.map(v => v.item) as string[];
    } else {
      versions = this.suite.batches;
    }
    const items = versions.slice(0, 10).map(v => ({ slug: v, tags: [] }));
    const setTag = (name: string, func: (v: Version) => boolean) => {
      const item = items.find(func);
      if (item) {
        item.tags.push(name);
      }
    };
    const baseline = this.suite.promotions.slice(-1)[0];
    setTag('latest', v => v.slug === this.suite.latest.batchSlug);
    setTag('baseline', v => v.slug === baseline.to);
    setTag('former baseline', v => v.slug === baseline.from && v.slug !== baseline.to);
    this._relevantVersions = items;
  }

  /**
   *
   */
  updateVersion(version: string) {
    if (this.side === 'head') {
      this._srcBatchChanged.next(version);
    } else if (this.side === 'base') {
      this._dstBatchChanged.next(version);
    }
  }

  /**
   *
   */
  get relevantVersions(): Version[] {
    return this._relevantVersions;
  }

  /**
   *
   */
  get currentVersion(): string {
    return this.side === 'head' ? this.params.srcBatchSlug : this.params.dstBatchSlug;
  }

  /**
   *
   */
  public countVersions(): number {
    return this.suite.batchCount;
  }

  /**
   *
   */
  public countVersionsNotShown(): number {
    const count = this.countVersions();
    return count === 0 ? 0 : count - this._relevantVersions.length;
  }

  /**
   *
   */
  onKeyupVersionFilter(text: string) {
    this._versionQueryChanged.next(text);
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
