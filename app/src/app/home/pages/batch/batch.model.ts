/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ParamMap } from '@angular/router';
import type { BatchCompareOverview, BatchComparisonItemCommon, BatchComparisonItemSolo, Userinfo } from 'src/app/core/models/commontypes';
import { FrontendBatchCompareParams } from 'src/app/core/models/frontendtypes';

type DataType = BatchComparisonItemCommon | BatchComparisonItemSolo;

/**
 *
 */
export type BatchPageOverviewMetadata = BatchCompareOverview & {
  batchIsSealed: boolean;
  batchSubmittedAt: Date;
  batchSubmittedBy: Userinfo[];
};

/**
 *
 */
export enum BatchPageItemType {
  Common = 'common',
  Missing = 'missing',
  Fresh = 'fresh'
}

/**
 *
 */
type BatchNextPageQueryParams = {
  cv: string;
  v: string;
  bcv: string;
  bv: string;
};

/**
 *
 */
export function nextPageQueryParams(
  queryParamMap: ParamMap,
  params: FrontendBatchCompareParams,
  type: BatchPageItemType
): BatchNextPageQueryParams {
  const qmap = queryParamMap;
  const tryGet = (key) => qmap.has(key) ? qmap.get(key) : undefined;
  const queries = { cv: tryGet('cv'), v: tryGet('v') } as BatchNextPageQueryParams;
  switch (type) {
    case BatchPageItemType.Fresh:
      queries.cv = params.srcBatchSlug;
      queries.bcv = qmap.has('cv') ? qmap.get('cv') : params.dstBatchSlug;
      break;
    case BatchPageItemType.Missing:
      queries.v = params.dstBatchSlug;
      queries.bv = qmap.has('v') ? qmap.get('v') : params.srcBatchSlug;
      break;
  }
  return queries;
}

/**
 *
 */
export class BatchPageItem {

  private _solo: BatchComparisonItemSolo;
  private _common: BatchComparisonItemCommon;
  private _type: BatchPageItemType;
  public elementName: string;
  public builtAt: Date;

  /**
   *
   */
  public constructor(data: DataType, type: BatchPageItemType) {
    this._type = type;
    if (type === BatchPageItemType.Common) {
      this._common = data as BatchComparisonItemCommon;
      this.elementName = this._common.src.elementName;
      this.builtAt = new Date(this._common.src.builtAt);
    } else if (type === BatchPageItemType.Fresh || type === BatchPageItemType.Missing) {
      this._solo = data as BatchComparisonItemSolo;
      this.elementName = this._solo.elementName;
      this.builtAt = new Date(this._solo.builtAt);
    }
  }

  /**
   *
   */
  public get type(): BatchPageItemType {
    return this._type;
  }

  /**
   *
   */
  public asCommon(): BatchComparisonItemCommon {
    return this._common;
  }

  /**
   *
   */
  public asSolo(): BatchComparisonItemSolo {
    return this._solo;
  }

  /**
   *
   */
  public isPendingComparison(): boolean {
    return this._type === BatchPageItemType.Common && !this._common.meta;
  }

}
