/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';
import {
  add,
  format,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration
} from 'date-fns';

@Pipe({
  name: 'datetime'
})
export class DateTimePipe implements PipeTransform {
  transform(
    input: string | number | Date,
    type: 'format' | 'distance' | 'duration',
    ...args: string[]
  ): string {
    if (type === 'format') {
      return format(new Date(input), 'PPpp');
    }
    if (type === 'distance') {
      return formatDistanceToNow(new Date(input), {
        addSuffix: true
      });
    }
    if (type === 'duration') {
      const duration: Duration = {};
      duration[args[0]] = input;
      return formatDuration(
        intervalToDuration({
          start: new Date(0),
          end: add(new Date(0), duration)
        })
      );
    }
    return '';
  }
}
