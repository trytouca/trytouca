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
  /**
   * simple `date-fns` locale that uses the abbreviated form of duration units
   * such as `m` instead of `minutes`.
   */
  private durationLocale(token: string, count: number) {
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
  private transformDuration(input: number, args: string[]): string {
    const maxUnits = args.length === 0 ? 2 : Number(args[0]);
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
      locale: { formatDistance: this.durationLocale }
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

  /**
   *
   */
  transform(
    input: string | number | Date,
    type: 'format' | 'distance' | 'interval' | 'duration',
    ...args: string[]
  ): string {
    if (type === 'format') {
      return format(new Date(input), 'PPpp');
    }
    if (type === 'distance') {
      return formatDistanceToNow(new Date(input), { addSuffix: true });
    }
    if (type === 'interval') {
      return this.transformInterval(input as number, args);
    }
    if (type === 'duration') {
      return this.transformDuration(input as number, args);
    }
    return '';
  }
}
