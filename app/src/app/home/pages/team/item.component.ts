// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faCircle,
  faSpinner,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import type { SuiteLookupResponse } from '@touca/api-schema';
import { format } from 'date-fns';

import { PillContainerComponent } from '@/home/components';
import { Metric, MetricChangeType } from '@/home/models/metric.model';
import {
  Data,
  Icon,
  IconColor,
  IconType,
  Topic,
  TopicType
} from '@/home/models/page-item.model';
import { DateAgoPipe, DateTimePipe } from '@/shared/pipes';

type Meta = Partial<{
  base: string;
  baseName: string;
  batchCount: number;
  countFresh: number;
  countHead: number;
  countMissing: number;
  countPending: number;
  head: string;
  headName: string;
  performance: string;
  score: number;
  submittedAt: Date;
}>;

@Component({
  selector: 'app-team-item-suite',
  templateUrl: './item.component.html',
  providers: [DateAgoPipe, DateTimePipe, I18nPluralPipe, PercentPipe]
})
export class TeamItemSuiteComponent extends PillContainerComponent {
  data: Data;
  icon: Icon;
  private _meta: Meta = {};

  @Input()
  set item(item: SuiteLookupResponse) {
    this.initMetadata(item);
    this.applyChosenTopics();
  }

  constructor(
    private dateAgoPipe: DateAgoPipe,
    private dateTimePipe: DateTimePipe,
    private i18pluralPipe: I18nPluralPipe,
    private percentPipe: PercentPipe,
    private faIconLibrary: FaIconLibrary
  ) {
    super();
    faIconLibrary.addIcons(faCircle, faSpinner, faCheckCircle, faTimesCircle);
  }

  private initMetadata(item: SuiteLookupResponse): void {
    this.data = {
      name: item.suiteName || item.suiteSlug,
      link: item.suiteSlug,
      query: null
    };
    this._meta.batchCount = item.batchCount;
    if (item.overview) {
      this._meta.score =
        Math.floor(item.overview.elementsScoreAggregate * 100) / 100;
      this._meta.countFresh = item.overview.elementsCountFresh;
      this._meta.countHead = item.overview.elementsCountHead;
      this._meta.countMissing = item.overview.elementsCountMissing;
      this._meta.countPending = item.overview.elementsCountPending;
      this._meta.performance = this.initPerformance(
        new Metric(
          '',
          item.overview.metricsDurationHead,
          item.overview.metricsDurationHead -
            item.overview.metricsDurationChange *
              item.overview.metricsDurationSign
        )
      );
    }
    if (item.baseline) {
      this._meta.base = item.baseline.batchSlug;
      this._meta.baseName = item.baseline.batchSlug.split('@')[0];
    }
    if (item.latest) {
      this._meta.head = item.latest.batchSlug;
      this._meta.headName = item.latest.batchSlug.split('@')[0];
      this._meta.submittedAt = new Date(item.latest.submittedAt);
    }
    this.icon = this.initIcon();
    this.topics = this.initTopics();
  }

  private initIcon(): Icon {
    // if suite has no batches
    if (!this._meta.base) {
      return {
        color: IconColor.Gray,
        type: IconType.Circle,
        tooltip: 'Empty Suite'
      };
    }

    // if latest batch is being compared
    if (this._meta.countPending !== 0) {
      return {
        color: this._meta.score === 1 ? IconColor.Green : IconColor.Orange,
        type: IconType.Spinner,
        spin: true,
        tooltip: 'Being Compared'
      };
    }

    // if suite has no common or new test cases
    if (this._meta.countHead && this._meta.countHead === 0) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Completely Different'
      };
    }

    // if test case has zero match score
    if (this._meta.score && this._meta.score === 0) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Completely Different'
      };
    }

    // if test case has missing keys
    if (this._meta.countMissing && this._meta.countMissing !== 0) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle
      };
    }

    // if test case has imperfect match score
    if (1 !== this._meta.score) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        tooltip: 'Has Differences'
      };
    }

    // otherwise
    return {
      color: IconColor.Green,
      type: IconType.CheckCircle,
      tooltip: 'No Difference'
    };
  }

  private initPerformance(metric: Metric): string {
    const duration = metric.duration();

    // it is possible that the function is called with no metric or a
    // metric with no duration in which case we opt not to show any
    // information about the runtime duration of the test case.
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
    const durationStr = this.dateTimePipe.transform(duration, 'duration');
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

  private initTopics(): Topic[] {
    const topics: Topic[] = [];

    if (this._meta.batchCount === 0) {
      return [{ text: 'No Results Yet', type: TopicType.EmptyNode }];
    }

    if (this._meta.score) {
      topics.push({
        color: ['text-sky-600'],
        icon: 'feather-file-plus',
        text: this.percentPipe.transform(this._meta.score, '1.0-0'),
        title: 'Match Score',
        type: TopicType.MatchRate
      });
    }

    if (this._meta.performance) {
      topics.push({
        color: ['text-green-600'],
        icon: 'hero-clock',
        text: this._meta.performance,
        type: TopicType.Performance
      });
    }

    topics.push({
      color: ['text-yellow-500'],
      icon: 'hero-star',
      text: `${this._meta.baseName} (baseline)`,
      type: TopicType.BaselineVersion
    });

    topics.push({
      color: ['text-green-500'],
      icon: 'hero-lightning-bolt',
      text: `${this._meta.headName} (latest)`,
      type: TopicType.LatestVersion
    });

    topics.push({
      color: ['text-sky-600'],
      icon: 'feather-file-text',
      text: this.i18pluralPipe.transform(this._meta.batchCount, {
        '=1': 'one version',
        other: '# versions'
      }),
      type: TopicType.Children
    });

    topics.push({
      color: ['text-purple-500'],
      icon: 'hero-calendar',
      text: this.dateAgoPipe.transform(this._meta.submittedAt),
      title: format(this._meta.submittedAt, 'PPpp'),
      type: TopicType.SubmissionDate
    });

    return topics;
  }
}
