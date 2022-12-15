// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCheckCircle,
  faChevronCircleDown,
  faChevronCircleUp,
  faCircle,
  faMinusCircle,
  faPlusCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { Metric, MetricChangeType } from '@/home/models/metric.model';
import { Icon, IconColor, IconType } from '@/home/models/page-item.model';

import { ElementPageMetric } from './element.model';

interface IMetadata {
  changeType: MetricChangeType;
  icon?: Icon;
  initialized: boolean;
}

@Component({
  selector: 'app-element-item-metric',
  templateUrl: './metric.component.html'
})
export class ElementItemMetricComponent {
  metric: Metric;
  category: ElementPageMetric['type'];
  MetricChangeType = MetricChangeType;

  meta: IMetadata = {
    initialized: false
  } as IMetadata;

  @Input() params: FrontendElementCompareParams;

  @Input()
  set key(metric: ElementPageMetric) {
    this.metric = metric.data;
    this.category = metric.type;
    this.initMetadata();
  }

  constructor(private faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIcons(
      faCircle,
      faCheckCircle,
      faTimesCircle,
      faPlusCircle,
      faMinusCircle,
      faChevronCircleDown,
      faChevronCircleUp
    );
  }

  private initMetadata(): void {
    this.meta.changeType = this.initChangeType();
    this.meta.icon = this.initIcon();
    this.meta.initialized = true;
  }

  private initChangeType(): MetricChangeType {
    return this.metric.changeType();
  }

  private initIcon(): Icon {
    switch (this.meta.changeType) {
      case MetricChangeType.Faster:
        return {
          color: IconColor.Green,
          type: IconType.ChevronCircleDown,
          tooltip: 'Faster'
        };
      case MetricChangeType.Fresh:
        return { color: IconColor.Green, type: IconType.PlusCircle };
      case MetricChangeType.Same:
        return {
          color: IconColor.Green,
          type: IconType.MinusCircle,
          tooltip: 'Similar'
        };
      case MetricChangeType.Missing:
        return { color: IconColor.Red, type: IconType.MinusCircle };
      case MetricChangeType.Slower:
        return {
          color: IconColor.Orange,
          type: IconType.ChevronCircleUp,
          tooltip: 'Slower'
        };
      default:
        return { color: IconColor.Gray, type: IconType.Circle };
    }
  }
}
