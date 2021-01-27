/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircle,
  faCheckCircle,
  faSpinner,
  faStar,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { Metric, MetricChangeType } from '@weasel/home/models/metric.model';
import {
  Data,
  Icon,
  IconColor,
  IconType,
  Topic
} from '@weasel/home/models/page-item.model';
import { DateTimePipe } from '@weasel/home/pipes';
import { FrontendBatchItem } from '@weasel/core/models/frontendtypes';

type Meta = Partial<{
  countFresh: number;
  countHead: number;
  countMissing: number;
  countPending: number;
  isBaseline: boolean;
  isSealed: boolean;
  performance: string;
  score: number;
  submittedAt: Date;
}>;

@Component({
  selector: 'app-suite-item-batch',
  templateUrl: './item.component.html',
  styleUrls: ['../../styles/item.component.scss'],
  providers: [DateTimePipe, I18nPluralPipe, PercentPipe]
})
export class SuiteItemBatchComponent {
  data: Data;
  icon: Icon;
  topics: Topic[];
  private _meta: Meta = {};

  /**
   *
   */
  @Input()
  set item(item: FrontendBatchItem) {
    this.initMetadata(item);
  }

  /**
   *
   */
  constructor(
    private datetimePipe: DateTimePipe,
    private i18pluralPipe: I18nPluralPipe,
    private percentPipe: PercentPipe,
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(
      faCircle,
      faSpinner,
      faCheckCircle,
      faStar,
      faTimesCircle
    );
  }

  /**
   *
   */
  private initMetadata(item: FrontendBatchItem): void {
    this.data = {
      name: item.batchSlug,
      link: item.batchSlug,
      query: null
    };
    this._meta.countFresh = item.meta.elementsCountFresh;
    this._meta.countHead = item.meta.elementsCountHead;
    this._meta.countMissing = item.meta.elementsCountMissing;
    this._meta.countPending = item.meta.elementsCountPending;
    this._meta.isBaseline = item.isBaseline;
    this._meta.isSealed = item.isSealed;
    this._meta.score = Math.floor(item.meta.elementsScoreAggregate * 100) / 100;
    this._meta.submittedAt = new Date(item.submittedAt);

    this._meta.performance = this.initPerformance(
      new Metric(
        '',
        item.meta.metricsDurationHead,
        item.meta.metricsDurationHead -
          item.meta.metricsDurationChange * item.meta.metricsDurationSign
      )
    );

    this.icon = this.initIcon();
    this.topics = this.initTopics();
  }

  /**
   *
   */
  private initIcon(): Icon {
    // if batch is not sealed
    if (!this._meta.isSealed || this._meta.countPending) {
      return {
        color: this._meta.score === 1 ? IconColor.Green : IconColor.Orange,
        type: IconType.Spinner,
        spin: true
      };
    }

    // if batch is baseline {
    if (this._meta.isBaseline) {
      return {
        color: IconColor.Gold,
        type: IconType.Star,
        spin: false
      };
    }

    // if batch has zero match score
    if (this._meta.score === 0) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if batch has missing elements
    if (this._meta.countMissing !== 0) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if batch has imperfect match score
    if (this._meta.score !== 1) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // otherwise
    return {
      color: IconColor.Green,
      type: IconType.CheckCircle,
      spin: false
    };
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
    const durationStr = this.datetimePipe.transform(duration, 'duration2');
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

    if (this._meta.score) {
      const score = this.percentPipe.transform(this._meta.score, '1.0-0');
      topics.push({ text: score, title: 'Match Score' });
    }

    if (this._meta.performance) {
      topics.push({ text: this._meta.performance });
    }

    if (this._meta.countHead) {
      let tcs = this.i18pluralPipe.transform(this._meta.countHead, {
        '=1': 'one case',
        other: '# cases'
      });
      if (this._meta.countPending) {
        tcs += ` (${this._meta.countPending} pending comparison)`;
      } else if (this._meta.countFresh && this._meta.countMissing) {
        tcs += ` (${this._meta.countFresh} new, ${this._meta.countMissing} missing)`;
      } else if (this._meta.countFresh && !this._meta.countMissing) {
        tcs += ` (${this._meta.countMissing} new)`;
      } else if (!this._meta.countFresh && this._meta.countMissing) {
        tcs += ` (${this._meta.countFresh} missing)`;
      }
      topics.push({ text: tcs });
    }

    topics.push({
      text: formatDistanceToNow(this._meta.submittedAt, {
        addSuffix: true
      }),
      title: format(this._meta.submittedAt, 'PPpp')
    });

    return topics;
  }
}
