// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { SuiteLookupResponse } from '@touca/api-schema';
import { Subscription } from 'rxjs';

import type { FrontendBatchCompareParams } from '@/core/models/frontendtypes';
import { PageListComponent } from '@/home/components/page-list.component';
import { FilterInput } from '@/home/models/filter.model';
import { TopicType } from '@/home/models/page-item.model';

import { BatchPageItem, nextPageQueryParams } from './batch.model';
import { BatchPageService } from './batch.service';

const filterInput: FilterInput<BatchPageItem> = {
  identifier: 'filter_batch_elements',
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
        if (a.type !== 'common') {
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
        if (a.type !== 'common') {
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
        if (a.type !== 'common') {
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
          if (v.type === 'common') {
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
      key: 'duration-change',
      name: 'Duration Change',
      func: (a, b) => {
        if (a.type !== b.type) {
          return b.type < a.type ? 1 : -1;
        }
        const getDurationChange = (v: BatchPageItem) => {
          if (v.type === 'common') {
            const metaCommon = v.asCommon().meta;
            return metaCommon
              ? metaCommon.metricsDurationCommonSrc -
                  metaCommon.metricsDurationCommonDst
              : 0;
          }
          const metaSolo = v.asSolo().meta;
          return metaSolo ? metaSolo.metricsDuration : 0;
        };
        return getDurationChange(b) - getDurationChange(a);
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
          if (v.type === 'common') {
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
          if (v.type === 'common') {
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
  templateUrl: './list.component.html'
})
export class BatchListElementsComponent
  extends PageListComponent<BatchPageItem>
  implements OnDestroy
{
  suite: SuiteLookupResponse;
  params: FrontendBatchCompareParams;
  chosenTopic: TopicType;

  private _sub: Record<'params' | 'suite', Subscription>;

  constructor(
    batchPageService: BatchPageService,
    route: ActivatedRoute,
    router: Router
  ) {
    super(filterInput, ['common', 'fresh', 'missing'], route, router);
    this._subAllItems = batchPageService.items$.subscribe((v) => {
      this.initCollections(v);
    });
    this._sub = {
      suite: batchPageService.data.suite$.subscribe((v) => {
        this.suite = v;
      }),
      params: batchPageService.data.params$.subscribe((v) => {
        this.params = v;
      })
    };
  }

  ngOnDestroy() {
    Object.values(this._sub)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
    super.ngOnDestroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing keys 'j' and 'k' should navigate through items on the list
    if (['j', 'k'].includes(event.key)) {
      super.keyboardNavigateList(event, '#wsl-batch-tab-elements');
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

  updateChosenTopics(type: TopicType) {
    this.chosenTopic = type;
  }
}
