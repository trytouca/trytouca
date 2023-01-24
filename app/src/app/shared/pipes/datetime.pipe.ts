// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Pipe, PipeTransform } from '@angular/core';
import {
  add,
  format,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration
} from 'date-fns';

import { transformDuration } from '@/home/models/metric.model';

@Pipe({
  name: 'datetime'
})
export class DateTimePipe implements PipeTransform {
  private transformInterval(input: number, args: string[]): string {
    const duration: Duration = {};
    duration[args[0]] = input;
    return formatDuration(
      intervalToDuration({
        start: new Date(0),
        end: add(new Date(0), duration)
      })
    );
  }

  transform(
    input: string | number | Date,
    type: 'format' | 'distance' | 'interval' | 'duration',
    ...args: string[]
  ): string {
    return !input
      ? ''
      : type === 'format'
      ? format(new Date(input), 'PPpp')
      : type === 'distance'
      ? formatDistanceToNow(new Date(input), { addSuffix: true })
      : type === 'interval'
      ? this.transformInterval(input as number, args)
      : type === 'duration'
      ? transformDuration(input as number)
      : '';
  }
}
