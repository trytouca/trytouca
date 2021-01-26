/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { intervalToDuration, formatDuration } from 'date-fns';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  /**
   * Formats a given duration in milliseconds to a human-readable string.
   *
   * @param input duration in milliseconds
   * @param largest maximum number of units to use in description
   */
  transform(input: number, maxUnits = 2): string {
    if (input === 0) {
      return '';
    }
    if (input < 1000) {
      return `${input}ms`;
    }
    const ms = input % 1000;
    const interval = intervalToDuration({ start: 0, end: input });
    const duration = formatDuration(interval, {
      format: ['hours', 'minutes', 'seconds'],
      zero: false
    });
    const units: Record<string, string> = {
      hour: 'h',
      hours: 'h',
      minute: 'm',
      minutes: 'm',
      second: 's',
      seconds: 's',
      ms: 'ms'
    };
    let parts = duration === '' ? [] : duration.split(' ');
    if (ms !== 0) {
      parts.push(ms.toString(), 'ms');
    }
    parts = parts.slice(0, maxUnits * 2);
    const output = [];
    for (let i = 0; i < parts.length; i += 2) {
      output.push(parts[i] + units[parts[i + 1]]);
    }
    return output.join(' ');
  }
}
