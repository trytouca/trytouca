// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { I18nPluralPipe, PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faCircle,
  faMinusCircle,
  faPlusCircle,
  faSpinner,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

import { FrontendBatchCompareParams } from '@/core/models/frontendtypes';
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
import { DateAgoPipe, DateTimePipe } from '@/shared/pipes';

import { BatchPageItem, nextPageQueryParams } from './batch.model';

type Metadata = Partial<{
  // Time since results for this test case were submitted
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
  providers: [DateAgoPipe, DateTimePipe, I18nPluralPipe, PercentPipe]
})
export class BatchItemElementComponent extends PillContainerComponent {
  data: Data;
  icon: Icon;

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
    this.applyChosenTopics();
  }

  constructor(
    private route: ActivatedRoute,
    private i18pluralPipe: I18nPluralPipe,
    private dateAgoPipe: DateAgoPipe,
    private percentPipe: PercentPipe,
    faIconLibrary: FaIconLibrary
  ) {
    super();
    faIconLibrary.addIcons(
      faCircle,
      faCheckCircle,
      faMinusCircle,
      faPlusCircle,
      faSpinner,
      faTimesCircle
    );
  }

  private initMetadata(): void {
    this._meta.builtAt = this._item.builtAt;
    let metric: Metric;
    switch (this._item.type) {
      case 'fresh': {
        const fresh = this._item.asSolo();
        if (fresh.meta) {
          this._meta.keysCount = fresh.meta.keysCount;
          metric = new Metric('', fresh.meta.metricsDuration, null);
        }
        break;
      }
      case 'missing': {
        const missing = this._item.asSolo();
        if (missing.meta) {
          this._meta.keysCount = missing.meta.keysCount;
          metric = new Metric('', null, missing.meta.metricsDuration);
        }
        break;
      }
      case 'common': {
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
    }
    if (metric) {
      this._meta.performance = initPerformance(metric);
    }
    this._meta.isCreatedRecently = this.isCreatedRecently();
    this._meta.isPendingComparison =
      this._item.type === 'common' && this._item.isPendingComparison();
    this.data = this.initData();
    this.icon = this.initIcon();
    this.topics = this.initTopics();
  }

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
   * Determines what color should the test case status be shown with.
   *
   * Test case status is shown in green if either
   *    * it is a fresh case (did not exist in baseline)
   *    * it has no missing keys and has perfect match score.
   *
   * Test case status is shown in orange if either
   *    * it has no keys
   *    * it has missing keys and at least one key that is either new or common
   *    * it has imperfect but non-zero match score
   *
   * Test case status is shown in red if either:
   *    * it is a missing case (did not exist in this batch)
   *    * it has missing keys and no new or common keys
   *    * it has zero match score
   *
   * @returns name of the color of the test case status
   */
  private initIcon(): Icon {
    // if test case is fresh (did not exist in baseline)
    if (this._item.type === 'fresh') {
      return {
        color: IconColor.Green,
        type: IconType.PlusCircle,
        tooltip: 'New Testcase'
      };
    }

    // if test case is missing (did not exist in this batch)
    if (this._item.type === 'missing') {
      return {
        color: IconColor.Red,
        type: IconType.MinusCircle,
        tooltip: 'Missing Testcase'
      };
    }

    // otherwise it is a common test case which may still be pending comparison
    if (this._item.isPendingComparison()) {
      return {
        color: IconColor.Blue,
        type: IconType.Spinner,
        spin: true,
        tooltip: 'Being Compared'
      };
    }

    const score = this._item.asCommon().meta.keysScore;

    // if test case has no keys
    if (0 === this._meta.keysCount + this._meta.keysCountMissing) {
      return {
        color: IconColor.Orange,
        type: IconType.Circle,
        tooltip: 'Empty Testcase'
      };
    }

    // if test case has no missing keys and has perfect match score.
    if (1 === score && 0 === this._meta.keysCountMissing) {
      return {
        color: IconColor.Green,
        type: IconType.CheckCircle,
        tooltip: 'No Difference'
      };
    }

    // if test case has missing keys and at least one key that is either new or common
    if (this._meta.keysCountMissing && 0 !== this._meta.keysCount) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        tooltip: 'Different Content'
      };
    }

    // if test case has imperfect but non-zero match score
    if (0 !== score && 1 !== score) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        tooltip: 'Has Differences'
      };
    }

    // if test case has missing keys and no new or common keys
    if (0 === score) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Missing Keys'
      };
    }

    // if test case has zero match score
    if (this._meta.keysCountMissing && 0 === this._meta.keysCount) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Completely Different'
      };
    }
  }

  private initTopics(): Topic[] {
    const topics: Topic[] = [];

    if (this._meta.isPendingComparison) {
      topics.push({ text: 'Being Compared', type: TopicType.EmptyNode });
    }

    if (this._meta.keysCount && this._meta.keysScore) {
      const score = this.percentPipe.transform(this._meta.keysScore, '1.0-1');
      topics.push({
        color: ['text-sky-600'],
        icon: 'featherFilePlus',
        text: score,
        title: 'Match Score',
        type: TopicType.MatchRate
      });
    }

    if (this._meta.performance) {
      topics.push({
        color: ['text-green-600'],
        icon: 'heroClock',
        text: this._meta.performance,
        type: TopicType.Performance
      });
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
      topics.push({
        color: ['text-sky-600'],
        icon: 'featherFileText',
        text: tcs,
        type: TopicType.Children
      });
    }

    if (this._meta.isCreatedRecently) {
      topics.push({
        color: ['text-purple-500'],
        icon: 'heroCalendar',
        text: this.dateAgoPipe.transform(this._meta.builtAt),
        title: format(this._meta.builtAt, 'PPpp'),
        type: TopicType.SubmissionDate
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
