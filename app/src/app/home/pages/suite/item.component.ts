// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faCircle,
  faSpinner,
  faStar,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

import { FrontendBatchItem } from '@/core/models/frontendtypes';
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
  countFresh: number;
  countHead: number;
  countMissing: number;
  countPending: number;
  isBaseline: boolean;
  isSealed: boolean;
  performance: string;
  score: number;
  slug: string;
  submittedAt: Date;
}>;

@Component({
  selector: 'app-suite-item-batch',
  templateUrl: './item.component.html',
  styleUrls: ['../../styles/item.component.scss'],
  providers: [DateAgoPipe, DateTimePipe, I18nPluralPipe, PercentPipe]
})
export class SuiteItemBatchComponent {
  data: Data;
  icon: Icon;
  topics: Topic[];
  shownTopics: Topic[];
  toggleState: TopicType | null;

  @Input()
  set item(item: FrontendBatchItem) {
    const meta = this.initMetadata(item);
    this.data = {
      link: meta.slug,
      name: meta.slug.split('@')[0],
      query: null
    };
    this.icon = this.initIcon(meta);
    this.topics = this.initTopics(meta);
    this.applyChosenTopics();
  }
  @Input()
  set chosenTopics(type: TopicType) {
    this.toggleState = type;
    this.applyChosenTopics(type);
  }
  @Output() updateChosenTopics = new EventEmitter<TopicType | null>();

  constructor(
    private dateAgoPipe: DateAgoPipe,
    private dateTimePipe: DateTimePipe,
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

  private initMetadata(item: FrontendBatchItem) {
    return {
      countFresh: item.meta.elementsCountFresh,
      countHead: item.meta.elementsCountHead,
      countMissing: item.meta.elementsCountMissing,
      countPending: item.meta.elementsCountPending,
      isBaseline: item.isBaseline,
      isSealed: item.isSealed,
      slug: item.batchSlug,
      score: Math.floor(item.meta.elementsScoreAggregate * 100) / 100,
      submittedAt: new Date(item.submittedAt),
      performance: this.initPerformance(
        new Metric(
          '',
          item.meta.metricsDurationHead,
          item.meta.metricsDurationHead -
            item.meta.metricsDurationChange * item.meta.metricsDurationSign
        )
      )
    };
  }

  private initIcon(meta: Meta): Icon {
    // if batch is not sealed
    if (!meta.isSealed || meta.countPending) {
      return {
        color: meta.score === 1 ? IconColor.Green : IconColor.Orange,
        type: IconType.Spinner,
        spin: true
      };
    }

    // if batch is baseline {
    if (meta.isBaseline) {
      return {
        color: IconColor.Gold,
        type: IconType.Star,
        spin: false
      };
    }

    // if batch has zero match score
    if (meta.score === 0) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if batch has missing elements
    if (meta.countMissing !== 0) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        spin: false
      };
    }

    // if batch has imperfect match score
    if (meta.score !== 1) {
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

  private initTopics(meta: Meta): Topic[] {
    const topics: Topic[] = [];

    if (meta.score) {
      const score = this.percentPipe.transform(meta.score, '1.0-0');
      topics.push({
        type: TopicType.MatchRate,
        color: ['bg-green-200'],
        text: score,
        title: 'Match Score',
        click: () => this.toggleChosenTopics(TopicType.MatchRate)
      });
    }

    if (meta.performance) {
      topics.push({
        type: TopicType.Performance,
        color: ['bg-sky-200'],
        text: meta.performance,
        click: () => this.toggleChosenTopics(TopicType.Performance)
      });
    }

    if (meta.countHead) {
      let tcs = this.i18pluralPipe.transform(meta.countHead, {
        '=1': 'one case',
        other: '# cases'
      });
      if (meta.countPending) {
        tcs += ` (${meta.countPending} pending comparison)`;
      } else if (meta.countFresh && meta.countMissing) {
        tcs += ` (${meta.countFresh} new, ${meta.countMissing} missing)`;
      } else if (meta.countFresh && !meta.countMissing) {
        tcs += ` (${meta.countFresh} new)`;
      } else if (!meta.countFresh && meta.countMissing) {
        tcs += ` (${meta.countMissing} missing)`;
      }
      topics.push({
        type: TopicType.TestCases,
        color: ['bg-red-200'],
        text: tcs,
        click: () => this.toggleChosenTopics(TopicType.TestCases)
      });
    }

    topics.push({
      type: TopicType.SubmissionDate,
      color: ['bg-purple-200'],
      text: this.dateAgoPipe.transform(meta.submittedAt),
      title: format(meta.submittedAt, 'PPpp'),
      click: () => this.toggleChosenTopics(TopicType.SubmissionDate)
    });

    return topics;
  }

  private toggleChosenTopics(type: TopicType) {
    this.updateChosenTopics.emit(this.toggleState === type ? null : type);
  }

  private applyChosenTopics(type?: TopicType) {
    this.toggleState = type;
    this.shownTopics = type
      ? this.topics.filter((v) => type === v.type)
      : this.topics;
  }
}
