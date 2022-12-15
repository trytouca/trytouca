// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ElementListResponseItem } from '@touca/api-schema';

import type { FrontendBatchItem } from '@/core/models/frontendtypes';
import { PageListItem } from '@/home/models/page-list-item.model';

type SuitePageItemType = 'batch';
type SuitePageElementType = 'element';

export class SuitePageItem extends PageListItem<
  FrontendBatchItem,
  SuitePageItemType
> {
  /** to be removed */
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
      case 'batch':
        return this.asBatch().submittedAt as unknown as Date;
    }
  }

  public get searchKey(): string {
    switch (this.type) {
      case 'batch':
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
