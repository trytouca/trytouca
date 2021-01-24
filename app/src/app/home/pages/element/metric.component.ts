/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faCircle,
  faCheckCircle,
  faTimesCircle,
  faPlusCircle,
  faMinusCircle,
  faChevronCircleDown,
  faChevronCircleUp
} from '@fortawesome/free-solid-svg-icons';
import { Metric, MetricChangeType } from '@weasel/home/models/metric.model';
import type { FrontendElementCompareParams } from '@weasel/core/models/frontendtypes';
import { ElementPageMetric, ElementPageItemType } from './element.model';

interface Icon {
  color: string;
  type: string;
}

interface IMetadata {
  changeType: MetricChangeType;
  icon?: Icon;
  initialized: boolean;
}

@Component({
  selector: 'app-element-item-metric',
  templateUrl: './metric.component.html',
  styleUrls: ['../../styles/item.component.scss']
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
