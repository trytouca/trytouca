/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, Input } from '@angular/core';
import { Chart } from 'chart.js';
import { DurationPipe } from 'src/app/home/pipes/duration.pipe';

@Component({
  selector: 'app-suite-chart-runtime',
  templateUrl: './chart.component.html',
  providers: [ DurationPipe ]
})
export class SuiteChartRuntimeComponent {

  private lineChartTemplate: Chart.ChartConfiguration = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Overall Execution Runtime',
        data: [],
        backgroundColor: [
          'rgba(148,159,177,0.2)'
        ],
        borderColor: [
          'rgba(148,159,177,1)'
        ],
        pointRadius: 4,
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        borderWidth: 1
      }]
    },
    options: {
      aspectRatio: 3,
      responsive: true,
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Overall Execution Runtime'
          },
          ticks: {
            callback: (value: number, index, values) => {
              return this.durationPipe.transform(value, 1, ['m', 's', 'ms']);
            },
            maxTicksLimit: 5
          }
        }]
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem: Chart.ChartTooltipItem, data: Chart.ChartData) => {
            const value = Number(tooltipItem.yLabel);
            return this.durationPipe?.transform(value, 2, ['h', 'm', 's', 'ms']) || '';
          }
        },
        displayColors: false
      }
    }
  };

  constructor(
    private durationPipe: DurationPipe,
  ) {
  }

  @Input()
  set perfs(perfs: { slug: string, duration: number }[]) {
    if (!perfs) {
      return;
    }
    perfs.reverse();
    const durations = perfs.map(v => v.duration);
    const labels = perfs.map(v => v.slug);
    const chartContext = (document.getElementById('suite-chart-runtime-trend') as HTMLCanvasElement).getContext('2d');
    const chartConfig = this.lineChartTemplate;
    chartConfig.data.datasets[0].data = durations;
    chartConfig.data.labels = labels;
    const runtimeChart = new Chart(chartContext, chartConfig);
  }

}
