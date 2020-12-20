/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import type { CppTypeComparison, Userinfo } from 'src/app/core/models/commontypes';
import { PageListItem } from 'src/app/home/models/page-list-item.model';
import { Metric } from 'src/app/home/models/metric.model';
import { Result } from 'src/app/home/models/result.model';

/**
 *
 */
export type ElementPageOverviewMetadata = {
  resultsCountHead: number;
  resultsCountFresh: number;
  resultsCountMissing: number;
  resultsCountDifferent: number;
  resultsScore: number;

  metricsCountHead: number;
  metricsCountFresh: number;
  metricsCountMissing: number;
  metricsDurationHead: number;
  metricsDurationChange: number;
  metricsDurationSign: number;

  messageBuiltAt: Date;
  messageSubmittedAt: Date;
  messageSubmittedBy: Userinfo;
};

/**
 *
 */
export enum ElementPageItemType {
  Common = 'common',
  Missing = 'missing',
  Fresh = 'fresh'
}

/**
 *
 */
export class ElementPageResult extends PageListItem<Result, ElementPageItemType> {
  public constructor(data: Result, type: ElementPageItemType) {
    super(data, type);
  }
}

/**
 *
 */
export class ElementPageMetric extends PageListItem<Metric, ElementPageItemType> {
  public constructor(k: CppTypeComparison, type: ElementPageItemType) {
    if (k.score && k.score === 1) {
      k.dstValue = k.srcValue;
    }
    const val = new Metric(k.name, +k.srcValue || null, +k.dstValue || null);
    super(val, type);
  }
}
