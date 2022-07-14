// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { CppTypeComparison, Userinfo } from '@touca/api-schema';

import { Metric } from '@/home/models/metric.model';
import { PageListItem } from '@/home/models/page-list-item.model';
import { Result } from '@/home/models/result.model';

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

export enum ElementPageItemType {
  Common = 'common',
  Missing = 'missing',
  Fresh = 'fresh'
}

export class ElementPageResult extends PageListItem<
  Result,
  ElementPageItemType
> {
  public constructor(data: Result, type: ElementPageItemType) {
    super(data, type);
  }
}

export class ElementPageMetric extends PageListItem<
  Metric,
  ElementPageItemType
> {
  public constructor(k: CppTypeComparison, type: ElementPageItemType) {
    if (k.score && k.score === 1) {
      k.dstValue = k.srcValue;
    }
    const val = new Metric(k.name, +k.srcValue || null, +k.dstValue || null);
    super(val, type);
  }
}
