/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import type { SuiteLookupResponse } from '@/core/models/commontypes';
import type { FrontendBatchCompareParams } from '@/core/models/frontendtypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';

import {
  BatchPageItem,
  BatchPageItemType,
  nextPageQueryParams
} from './batch.model';
import { BatchPageService } from './batch.service';

const filterInput: FilterInput<BatchPageItem> = {
  filters: [
    {
      key: 'none',
      name: 'None',
      func: (a) => true
    },
    {
      key: 'different',
      name: 'Different',
      func: (a) => {
        if (a.type !== BatchPageItemType.Common) {
          return true;
        }
        const meta = a.asCommon().meta;
        return (
          meta &&
          (meta.keysCountFresh || meta.keysCountMissing || meta.keysScore !== 1)
        );
      }
    },
    {
      key: 'faster',
      name: 'Faster',
      func: (a) => {
        if (a.type !== BatchPageItemType.Common) {
          return false;
        }
        const meta = a.asCommon().meta;
        return meta.metricsDurationCommonSrc < meta.metricsDurationCommonDst;
      }
    },
    {
      key: 'slower',
      name: 'Slower',
      func: (a) => {
        if (a.type !== BatchPageItemType.Common) {
          return false;
        }
        const meta = a.asCommon().meta;
        return meta.metricsDurationCommonDst < meta.metricsDurationCommonSrc;
      }
    },
    {
      key: 'compared',
      name: 'Compared',
      func: (a) => !a.isPendingComparison()
    },
    {
      key: 'pending',
      name: 'Pending Comparison',
      func: (a) => a.isPendingComparison()
    }
  ],
  sorters: [
    {
      key: 'date',
      name: 'Date',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        return +new Date(b.builtAt) - +new Date(a.builtAt);
      }
    },
    {
      key: 'duration',
      name: 'Duration',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        const getDuration = (v: BatchPageItem) => {
          if (v.type === BatchPageItemType.Common) {
            const metaCommon = v.asCommon().meta;
            return metaCommon ? metaCommon.metricsDurationCommonSrc : 0;
          }
          const metaSolo = v.asSolo().meta;
          return metaSolo ? metaSolo.metricsDuration : 0;
        };
        return getDuration(b) - getDuration(a);
      }
    },
    {
      key: 'keys',
      name: 'Number of Keys',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        const getKeysCount = (v: BatchPageItem) => {
          if (v.type === BatchPageItemType.Common) {
            const metaCommon = v.asCommon().meta;
            return metaCommon
              ? metaCommon.keysCountCommon + metaCommon.keysCountFresh
              : 0;
          }
          const metaSolo = v.asSolo().meta;
          return metaSolo ? metaSolo.keysCount : 0;
        };
        return getKeysCount(b) - getKeysCount(a);
      }
    },
    {
      key: 'score',
      name: 'Match Rate',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        const getKeysScore = (v: BatchPageItem) => {
          if (v.type === BatchPageItemType.Common) {
            const meta = v.asCommon().meta;
            return meta ? meta.keysScore : 0;
          }
          return 0;
        };
        return getKeysScore(b) - getKeysScore(a);
      }
    },
    {
      key: 'name',
      name: 'Name',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        return b.elementName.localeCompare(a.elementName);
      }
    }
  ],
  searchBy: ['elementName'],
  defaults: {
    filter: 'none',
    search: '',
    sorter: 'date',
    order: 'dsc',
    pagen: 1,
    pagel: 100
  },
  queryKeys: {
    filter: 'f',
    search: 'q',
    sorter: 's',
    order: 'o',
    pagen: 'n',
    pagel: 'l'
  },
  placeholder: 'Find a testcase'
};

@Component({
  selector: 'app-batch-list-elements',
  templateUrl: './list.component.html',
  styleUrls: ['../../styles/list.component.scss']
})
export class BatchListElementsComponent
  extends PageListComponent<BatchPageItem>
  implements OnDestroy
{
  suite: SuiteLookupResponse;
  params: FrontendBatchCompareParams;
  ItemType = BatchPageItemType;

  private _subSuite: Subscription;
  private _subParams: Subscription;

  /**
   *
   */
  constructor(
    private batchPageService: BatchPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, Object.values(BatchPageItemType), route, router);
    this._subAllItems = this.batchPageService.items$.subscribe((allItems) => {
      this.initCollections(allItems);
    });
    this._subSuite = this.batchPageService.suite$.subscribe((v) => {
      this.suite = v;
    });
    this._subParams = this.batchPageService.params$.subscribe((v) => {
      this.params = v;
    });
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subSuite.unsubscribe();
    this._subParams.unsubscribe();
    super.ngOnDestroy();
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-batch-elements');
      return;
    }
    const row = this.selectedRow;
    // pressing 'escape' when an item is selected should unselect it
    if ('Escape' === event.key && row !== -1) {
      this.selectedRow = -1;
    }
    // pressing 'enter' when an item is selected should route to the next page
    if ('Enter' === event.key && row !== -1) {
      const item = this._items[row];
      const queryParamMap = this.route.snapshot.queryParamMap;
      const queryParams = nextPageQueryParams(
        queryParamMap,
        this.params,
        item.type
      );
      this.router.navigate([item.elementName], {
        relativeTo: this.route,
        queryParams
      });
    }
  }
}
