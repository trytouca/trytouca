// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
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
import { PillContainerComponent } from '@/home/components';
import { initPerformance, Metric } from '@/home/models/metric.model';
import {
  Data,
  Icon,
  IconColor,
  IconType,
  Topic,
  TopicType
} from '@/home/models/page-item.model';
import { DateAgoPipe } from '@/shared/pipes';

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
  providers: [DateAgoPipe, I18nPluralPipe, PercentPipe]
})
export class SuiteItemBatchComponent extends PillContainerComponent {
  data: Data;
  icon: Icon;

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

  constructor(
    private dateAgoPipe: DateAgoPipe,
    private i18pluralPipe: I18nPluralPipe,
    private percentPipe: PercentPipe,
    faIconLibrary: FaIconLibrary
  ) {
    super();
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
      performance: initPerformance(
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
        spin: true,
        tooltip: 'Being Compared'
      };
    }

    // if batch is baseline {
    if (meta.isBaseline) {
      return {
        color: IconColor.Gold,
        type: IconType.Star,
        tooltip: 'Baseline Version'
      };
    }

    // if batch has zero match score
    if (meta.score === 0) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Completely Different'
      };
    }

    // if batch has missing elements
    if (meta.countMissing !== 0) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        tooltip: 'Missing'
      };
    }

    // if batch has imperfect match score
    if (meta.score !== 1) {
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

  private initTopics(meta: Meta): Topic[] {
    const topics: Topic[] = [];

    if (meta.score) {
      const score = this.percentPipe.transform(meta.score, '1.0-0');
      topics.push({
        color: ['text-sky-600'],
        icon: 'featherFilePlus',
        text: score,
        title: 'Match Score',
        type: TopicType.MatchRate
      });
    }

    if (meta.performance) {
      topics.push({
        color: ['text-green-600'],
        icon: 'heroClock',
        text: meta.performance,
        type: TopicType.Performance
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
        color: ['text-sky-600'],
        icon: 'featherFileText',
        text: tcs,
        type: TopicType.Children
      });
    }

    topics.push({
      color: ['text-purple-500'],
      icon: 'heroCalendar',
      text: this.dateAgoPipe.transform(meta.submittedAt),
      title: format(meta.submittedAt, 'PPpp'),
      type: TopicType.SubmissionDate
    });

    return topics;
  }
}
