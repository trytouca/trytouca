// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { ElementListResponseItem } from '@touca/api-schema';

import type { FrontendBatchItem } from '@/core/models/frontendtypes';
import { PageListItem } from '@/home/models/page-list-item.model';

export enum SuitePageItemType {
  Batch = 'batch'
}

export enum SuitePageElementType {
  Element = 'element'
}

export class SuitePageItem extends PageListItem<
  FrontendBatchItem,
  SuitePageItemType
> {
  /**
   * to be removed
   */
  public static compareByDate(a: SuitePageItem, b: SuitePageItem): number {
    return +new Date(b.eventDate()) - +new Date(a.eventDate());
  }

  public constructor(data: FrontendBatchItem, type: SuitePageItemType) {
    super(data, type);
  }

  public asBatch(): FrontendBatchItem {
    return this.data;
  }

  public eventDate(): Date {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().submittedAt;
    }
  }

  public get searchKey(): string {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().batchSlug;
    }
  }
}

export class SuitePageElement extends PageListItem<
  ElementListResponseItem,
  SuitePageElementType
> {
  public constructor(
    data: ElementListResponseItem,
    type: SuitePageElementType
  ) {
    super(data, type);
  }
}
