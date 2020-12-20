/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import type { FrontendBatchItem, PromotionItem } from 'src/app/core/models/frontendtypes';
import { PageListItem } from 'src/app/home/models/page-list-item.model';

type DataType = FrontendBatchItem | PromotionItem;

/**
 *
 */
export enum SuitePageItemType {
  Batch = 'batch',
  Promotion = 'promotion'
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
    return this.data as FrontendBatchItem;
  }

  /**
   *
   */
  public asPromotion(): PromotionItem {
    return this.data as PromotionItem;
  }

  /**
   *
   */
  public eventDate(): Date {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().submittedAt;
      case SuitePageItemType.Promotion:
        return this.asPromotion().at;
    }
  }

  /**
   *
   */
  public get searchKey(): string {
    switch (this.type) {
      case SuitePageItemType.Batch:
        return this.asBatch().batchSlug;
      case SuitePageItemType.Promotion:
        return this.asPromotion().to;
    }
  }

}
