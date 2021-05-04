/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircle,
  faCheckCircle,
  faPlusCircle,
  faMinusCircle,
  faSpinner,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { FrontendBatchCompareParams } from '@weasel/core/models/frontendtypes';
import { Metric, MetricChangeType } from '@weasel/home/models/metric.model';
import {
  Data,
  Icon,
  IconColor,
  IconType,
  Topic
} from '@weasel/home/models/page-item.model';
import { DateTimePipe } from '@weasel/shared/pipes';
import {
  BatchPageItem,
  BatchPageItemType,
  nextPageQueryParams
} from './batch.model';

type Metadata = Partial<{
  // Time since results for this testcase were submitted
  builtAt: Date;
  isCreatedRecently: boolean;
  isPendingComparison: boolean;
  keysCount: number;
  keysCountFresh: number;
  keysCountMissing: number;
  keysScore: number;
  performance: string;
}>;

@Component({
  selector: 'app-batch-item-element',
  templateUrl: './item.component.html',
  styleUrls: ['../../styles/item.component.scss'],
  providers: [DateTimePipe, I18nPluralPipe, PercentPipe]
})
export class BatchItemElementComponent {
  data: Data;
  icon: Icon;
  topics: Topic[];
  private _meta: Metadata = {
    keysCount: 0,
    keysCountFresh: 0,
    keysCountMissing: 0
  };

  private _item: BatchPageItem;
  private _params: FrontendBatchCompareParams;

  @Input()
  set params(params: FrontendBatchCompareParams) {
    this._params = params;
    this.data = this.initData();
  }

  @Input()
  set item(item: BatchPageItem) {
    this._item = item;
    this.initMetadata();
  }

  /**
   *
   */
  constructor(
    private route: ActivatedRoute,
    private i18pluralPipe: I18nPluralPipe,
    private datetimePipe: DateTimePipe,
    private percentPipe: PercentPipe,
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(
      faCircle,
      faCheckCircle,
      faMinusCircle,
      faPlusCircle,
      faSpinner,
      faTimesCircle
    );
  }

  /**
   *
   */
  private initMetadata(): void {
    this._meta.builtAt = this._item.builtAt;
    let metric: Metric;
    switch (this._item.type) {
      case BatchPageItemType.Fresh:
        const fresh = this._item.asSolo();
        if (fresh.meta) {
          this._meta.keysCount = fresh.meta.keysCount;
          metric = new Metric('', fresh.meta.metricsDuration, null);
        }
        break;
      case BatchPageItemType.Missing:
        const missing = this._item.asSolo();
        if (missing.meta) {
          this._meta.keysCount = missing.meta.keysCount;
          metric = new Metric('', null, missing.meta.metricsDuration);
        }
        break;
      case BatchPageItemType.Common:
        const common = this._item.asCommon();
        if (common.meta) {
          this._meta.keysCount =
            common.meta.keysCountCommon + common.meta.keysCountFresh;
          this._meta.keysCountFresh = common.meta.keysCountFresh;
          this._meta.keysCountMissing = common.meta.keysCountMissing;
          this._meta.keysScore = common.meta.keysScore;
          metric = new Metric(
            '',
            common.meta.metricsDurationCommonSrc,
            common.meta.metricsDurationCommonDst
          );
        }
        break;
    }
    if (metric) {
      this._meta.performance = this.initPerformance(metric);
    }
    this._meta.isCreatedRecently = this.isCreatedRecently();
    this._meta.isPendingComparison =
      this._item.type === BatchPageItemType.Common &&
      this._item.isPendingComparison();
    this.data = this.initData();
    this.icon = this.initIcon();
    this.topics = this.initTopics();
  }

  /**
   *
   */
  private initData(): Data {
    if (this._params && this._item) {
      return {
        name: this._item.elementName,
        link: this._item.elementName,
        query: nextPageQueryParams(
          this.route.snapshot.queryParamMap,
          this._params,
          this._item.type
        )
      };
    }
  }

  /**
   * Determines what color should the testcase status be shown with.
   *
   * Testcase status is shown in green if either
   *    * it is a fresh case (did not exist in baseline)
   *    * it has no missing keys and has perfect match score.
   *
   * Testcase status is shown in orange if either
   *    * it has no keys
   *    * it has missing keys and at least one key that is either new or common
   *    * it has imperfect but non-zero match score
   *
   * Testcase status is shown in red if either:
   *    * it is a missing case (did not exist in this batch)
   *    * it has missing keys and no new or common keys
   *    * it has zero match score
   *
   * @returns name of the color of the testcase status
   */
  private initIcon(): Icon {
    // if testcase is fresh (did not exist in baseline)
    if (this._item.type === BatchPageItemType.Fresh) {
      return {
        color: IconColor.Green,
        type: IconType.PlusCircle,
        spin: false
      };
    }

    // if testcase is missing (did not exist in this batch)
    if (this._item.type === BatchPageItemType.Missing) {
      return {
        color: IconColor.Red,
        type: IconType.MinusCircle,
        spin: false
      };
    }

    // otherwise it is a common testcase which may still be pending comparison
    if (this._item.isPendingComparison()) {
      return {
        color: IconColor.Blue,
        type: IconType.Spinner,
        spin: true
      };
    }

    const score = this._item.asCommon().meta.keysScore;

    // if testcase has no missing keys and has perfect match score.
    if (1 === score && 0 === this._meta.keysCountMissing) {
      return {
        color: IconColor.Green,
        type: IconType.CheckCircle,
        spin: false
      };
    }

    // if testcase has no keys
    if (0 === this._meta.keysCount + this._meta.keysCountMissing) {
      return {
        color: IconColor.Orange,
        type: IconType.Circle,
        spin: false
      };
    }

    // if testcase has missing keys and at least one key that is either new or common
    if (this._meta.keysCountMissing && 0 !== this._meta.keysCount) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if testcase has imperfect but non-zero match score
    if (0 !== score && 1 !== score) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if testcase has missing keys and no new or common keys
    if (0 === score) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if testcase has zero match score
    if (this._meta.keysCountMissing && 0 === this._meta.keysCount) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        spin: false
      };
    }
  }

  /**
   *
   */
  private initPerformance(metric: Metric): string {
    const duration = metric.duration();

    // it is possible that the function is called with no metric or a
    // metric with no duration in which case we opt not to show any
    // information about the runtime duration of the testcase.
    if (duration === 0) {
      return;
    }

    // if runtime duration is logged as less than 50 milliseconds, it
    // is likely so error-prone and noisy whose accurate reporting or
    // comparison is of no value. In this case, we choose to report it
    // simply as less than 50 milliseconds to distinguish this case
    // from cases with no duration.
    if (duration < 50) {
      return '<50ms';
    }

    const changeType = metric.changeType();
    const durationStr = this.datetimePipe.transform(duration, 'duration');
    if (
      changeType === MetricChangeType.Same ||
      changeType === MetricChangeType.Fresh ||
      changeType === MetricChangeType.Missing
    ) {
      return durationStr;
    }
    const change = metric.changeDescription();
    const sign = changeType === MetricChangeType.Faster ? 'faster' : 'slower';
    return `${durationStr} (${change} ${sign})`;
  }

  /**
   *
   */
  private initTopics(): Topic[] {
    const topics: Topic[] = [];

    if (this._meta.isPendingComparison) {
      topics.push({ text: 'Being Compared' });
    }

    if (this._meta.keysCount && this._meta.keysScore) {
      const score = this.percentPipe.transform(this._meta.keysScore, '1.0-1');
      topics.push({ text: score, title: 'Match Score' });
    }

    if (this._meta.performance) {
      topics.push({ text: this._meta.performance });
    }

    if (this._meta.keysCount) {
      let tcs = this.i18pluralPipe.transform(this._meta.keysCount, {
        '=1': 'one key',
        other: '# keys'
      });
      if (this._meta.keysCountFresh && this._meta.keysCountMissing) {
        tcs += ` (${this._meta.keysCountFresh} new, ${this._meta.keysCountMissing} missing)`;
      }
      if (this._meta.keysCountFresh && !this._meta.keysCountMissing) {
        tcs += ` (${this._meta.keysCountFresh} new)`;
      }
      if (!this._meta.keysCountFresh && this._meta.keysCountMissing) {
        tcs += ` (${this._meta.keysCountMissing} missing)`;
      }
      topics.push({ text: tcs });
    }

    if (this._meta.isCreatedRecently) {
      topics.push({
        text: formatDistanceToNow(this._meta.builtAt, {
          addSuffix: true
        }),
        title: format(this._meta.builtAt, 'PPpp')
      });
    }

    return topics;
  }

  /**
   * Indicates if the message was created in the last 7 days
   */
  private isCreatedRecently(): boolean {
    const now = new Date().getTime();
    const builtAt = this._meta.builtAt.getTime();
    const diff = Math.abs(now - builtAt);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 7;
  }
}
