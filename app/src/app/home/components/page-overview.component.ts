/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { PercentPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DurationPipe } from 'src/app/home/pipes/duration.pipe';
import { FrontendOverviewSection } from 'src/app/core/models/frontendtypes';
import { Metric, MetricChangeType } from 'src/app/home/models/metric.model';

type Ring = {
  header: string;
  footer: string[];
  title: string;
  backColor: string;
  frontColor: string;
  frontValue: number;
};

enum RingColor {
  Gray = 'lightgray',
  Green = '#28a745',
  Red = '#cc3c3c'
}

@Component({
  selector: 'app-home-page-overview',
  templateUrl: './page-overview.component.html',
  providers: [ DurationPipe, PercentPipe ]
})
export class PageOverviewComponent {

  metricsRing: Ring;
  resultsRing: Ring;
  statements: string[];

  constructor(
    private durationPipe: DurationPipe,
    private percentPipe: PercentPipe) {}

  @Input()
  set inputs(inputs: FrontendOverviewSection) {
    this.statements = inputs.statements;

    this.resultsRing = this.findResultsRing(inputs);
    this.metricsRing = this.findMetricsRing(inputs);

    const overview = document.querySelector('.wsl-page-overview');
    const circles = overview.querySelectorAll('circle');
    this.updateCircle(circles[1], this.resultsRing.frontValue);
    this.updateCircle(circles[3], this.metricsRing.frontValue);
  }

  /**
   *
   */
  private findResultsRing(inputs: FrontendOverviewSection): Ring {
    return {
      header: 'Match Rate' + (inputs.inProgress ? ' (so far)' : ''),
      footer: [],
      backColor: RingColor.Gray,
      frontColor: inputs.resultsScore === 1 ? RingColor.Green : RingColor.Red,
      frontValue: inputs.resultsScore,
      title: this.percentPipe.transform(inputs.resultsScore, '1.0-0')
    };
  }

  /**
   * frontColor: metric.score() > 0 ? RingColor.Red : RingColor.Green,
   * frontValue: Math.min(metric.score(), 1),
   */
  private findMetricsRing(inputs: FrontendOverviewSection): Ring {
    const Type = MetricChangeType;
    const describeDuration = (v, k) => this.durationPipe.transform(v, k, ['h', 'm', 's', 'ms']);
    const metric = new Metric('', inputs.metricsDurationHead,
      inputs.metricsDurationHead - inputs.metricsDurationChange * inputs.metricsDurationSign);
    const type = metric.changeType();
    const headDesc = describeDuration(metric.src, 2);
    const changeDesc = describeDuration(metric.absoluteDifference(), 1);
    const scoreDesc = this.percentPipe.transform(metric.score(), '1.0-0');

    return {
      header: 'Duration' + (inputs.inProgress ? ' (so far)' : ''),
      footer: type === Type.Same ? [ headDesc ]
        : type === Type.Faster ? [ headDesc, `(${changeDesc} faster)` ]
        : [ headDesc, `(${changeDesc} slower)` ],
      title: type === Type.Same ? 'Same' : type === Type.Faster ? scoreDesc : '+' + scoreDesc,
      backColor: RingColor.Gray,
      frontColor: type === Type.Slower ? RingColor.Red : RingColor.Green,
      frontValue: 1,
    };
  }

  /**
   *
   */
  private updateCircle(circle: SVGCircleElement, value: number) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - value * circumference;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
    circle.style.strokeDashoffset = `${offset}`;
  }

}
