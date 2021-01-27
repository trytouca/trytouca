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
   * simple `date-fns` locale that uses the abbreviated form of duration units
   * such as `m` instead of `minutes`.
   */
  private formatDistance(token: string, count: number) {
    const locale: Record<string, string> = {
      xSeconds: 's',
      xMinutes: 'm',
      xHours: 'h'
    };
    const unit = token in locale ? locale[token] : '?';
    return count.toString() + unit;
  }

  /**
   * Formats a given duration in milliseconds to a human-readable string.
   *
   * @param input duration in milliseconds
   * @param largest maximum number of units to use in description
   */
  transform(input: number, maxUnits = 2): string {
    // return empty string if duration is 0.
    if (input === 0) {
      return '';
    }
    // in this application, it is likely that most durations are extremely
    // short. To save time, we check this scenario and cut short if duration
    // is less than 1 second.
    if (input < 1000) {
      return `${input}ms`;
    }
    // in all other cases, we'd like to rely on `date-fns` to format the
    // duration.
    const interval = intervalToDuration({ start: 0, end: input });
    const duration = formatDuration(interval, {
      zero: false,
      delimiter: ' ',
      format: ['hours', 'minutes', 'seconds'],
      locale: { formatDistance: this.formatDistance }
    });
    // now we enforce our `maxUnits`
    // at this point, since `date-fns` does not support millisecond precision,
    // we manually append it before enforcing our `maxUnits` to adjust the
    // level of detail in the final output.
    const parts = duration.split(' ');
    const ms = input % 1000;
    if (ms !== 0) {
      parts.push(`${ms}ms`);
    }
    return parts.slice(0, maxUnits).join(' ');
  }
}
