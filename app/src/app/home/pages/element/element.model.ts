// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { TypeComparison, Userinfo } from '@touca/api-schema';

import { Metric } from '@/home/models/metric.model';
import { PageListItem } from '@/home/models/page-list-item.model';

export type ElementPageOverviewMetadata = {
  messageBuiltAt: Date;
  messageSubmittedAt: Date;
  messageSubmittedBy: Userinfo;

  assumptionsCountHead: number;
  assumptionsCountDifferent: number;

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
};

type ElementPageItemType = 'common' | 'missing' | 'fresh';

export class ElementPageResult extends PageListItem<
  TypeComparison,
  ElementPageItemType
> {
  public constructor(data: TypeComparison, type: ElementPageItemType) {
    super(data, type);
  }
}

export class ElementPageMetric extends PageListItem<
  Metric,
  ElementPageItemType
> {
  public constructor(k: TypeComparison, type: ElementPageItemType) {
    if (k.score && k.score === 1) {
      k.dstValue = k.srcValue;
    }
    const parse = (v: string | undefined) => {
      const x = parseFloat(v);
      return isNaN(x) ? null : x;
    };
    const val = new Metric(k.name, parse(k.srcValue), parse(k.dstValue));
    super(val, type);
  }
}
