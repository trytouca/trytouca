// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
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

import { ElementPageItemType, ElementPageMetric } from './element.model';

interface Icon {
  color: string;
  type: IconProp;
}

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
  category: ElementPageItemType;
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
        return { color: 'mediumseagreen', type: 'chevron-circle-down' };
      case MetricChangeType.Fresh:
        return { color: 'mediumseagreen', type: 'plus-circle' };
      case MetricChangeType.Same:
        return { color: 'mediumseagreen', type: 'minus-circle' };
      case MetricChangeType.Missing:
        return { color: 'mediumvioletred', type: 'minus-circle' };
      case MetricChangeType.Slower:
        return { color: 'darkorange', type: 'chevron-circle-up' };
      default:
        return { color: 'lightgray', type: 'circle' };
    }
  }
}
