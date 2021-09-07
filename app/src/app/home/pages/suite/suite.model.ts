// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { FrontendBatchItem } from '@/core/models/frontendtypes';
import { PageListItem } from '@/home/models/page-list-item.model';

type DataType = FrontendBatchItem;

/**
 *
 */
export enum SuitePageItemType {
  Batch = 'batch'
}

/**
 *
 */
export class SuitePageItem extends PageListItem<DataType, SuitePageItemType> {
  /**
   * to be removed
   */
  public static compareByDate(a: SuitePageItem, b: SuitePageItem): number {
    return +new Date(b.eventDate()) - +new Date(a.eventDate());
  }

  /**
   *
   */
  public constructor(data: DataType, type: SuitePageItemType) {
    super(data, type);
  }

  /**
   *
   */
  public asBatch(): FrontendBatchItem {
    return this.data;
  }

  /**
   *
   */
  public eventDate(): Date {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().submittedAt;
    }
  }

  /**
   *
   */
  public get searchKey(): string {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().batchSlug;
    }
  }
}
