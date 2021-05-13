/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input, OnDestroy } from '@angular/core';
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';

import { DateTimePipe } from '@/shared/pipes';

Chart.register(
  LineController,
  LinearScale,
  LineElement,
  CategoryScale,
  PointElement,
  Tooltip,
  Filler
);

@Component({
  selector: 'app-suite-chart-runtime',
  templateUrl: './chart.component.html',
  providers: [DateTimePipe]
})
export class SuiteChartRuntimeComponent implements OnDestroy {
  private chart: Chart;

  constructor(private datetimePipe: DateTimePipe) {}

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  @Input()
  set perfs(perfs: { slug: string; duration: number }[]) {
    if (!perfs || perfs.length == 0) {
      return;
    }
    perfs.reverse();
    const chartContext = (document.getElementById(
      'suite-chart-runtime-trend'
    ) as HTMLCanvasElement).getContext('2d');
    this.chart = new Chart(chartContext, {
      type: 'line',
      data: {
        labels: perfs.map((v) => v.slug),
        datasets: [
          {
            backgroundColor: 'rgba(148,159,177,0.2)',
            borderColor: 'rgba(148,159,177,1)',
            borderWidth: 1,
            tension: 0.25,
            data: perfs.map((v) => v.duration),
            fill: 'origin',
            label: 'Overall Execution Runtime',
            pointRadius: 4,
            pointBackgroundColor: 'rgba(148,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,177,0.8)'
          }
        ]
      },
      options: {
        aspectRatio: 3,
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            displayColors: false,
            enabled: true,
            intersect: false,
            mode: 'nearest',
            callbacks: {
              label: (context) => {
                const point = context.parsed.y;
                return this.datetimePipe?.transform(point, 'duration') || '';
              }
            }
          }
        },
        hover: {
          mode: 'nearest',
          intersect: false
        },
        scales: {
          y: {
            display: true,
            ticks: {
              callback: (value: number) => {
                return this.datetimePipe.transform(value, 'duration');
              },
              maxTicksLimit: 5
            },
            title: {
              display: true,
              text: 'Overall Execution Runtime'
            }
          }
        }
      }
    });
  }
}
