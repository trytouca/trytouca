// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { formatDuration, intervalToDuration } from 'date-fns/esm';

export enum MetricChangeType {
  Missing = 1,
  Slower,
  Same,
  Faster,
  Fresh
}

export class Metric {
  constructor(
    readonly name: string,
    readonly src: number | null,
    readonly dst: number | null
  ) {}

  public changeType(): MetricChangeType {
    // define threshold (in milliseconds) for the amount of time
    // that is considered prone to noise and measurement error
    const isSmall = (t: number) => t < 50;

    // if metric has no base value, it must be newly submitted
    if (this.dst === null) {
      return MetricChangeType.Fresh;
    }
    // if metric has no head value, it must be missing
    if (this.src === null) {
      return MetricChangeType.Missing;
    }
    // if measured time is too small for both head and base versions,
    // it is prone to noise and measurement error so report as not changed
    if (isSmall(this.dst) && isSmall(this.src)) {
      return MetricChangeType.Same;
    }
    // if measured time has not changed noticeably, report as not changed
    if (isSmall(this.absoluteDifference())) {
      return MetricChangeType.Same;
    }
    return this.src < this.dst
      ? MetricChangeType.Faster
      : MetricChangeType.Slower;
  }

  public changeDescription(): string {
    if (this.src === this.dst) {
      return 'same';
    }
    if (this.dst === 0) {
      return '';
    }
    const multiple =
      this.src > this.dst ? this.src / this.dst : this.dst / this.src;
    return multiple < 2
      ? `${Math.round((Math.abs(this.src - this.dst) / this.dst) * 100)}%`
      : `${multiple.toFixed(1)}x`;
  }

  public duration(): number {
    return this.src === null ? this.dst : this.src;
  }

  public absoluteDifference(): number {
    return Math.abs(this.src - this.dst);
  }

  public score(): number {
    switch (this.changeType()) {
      case MetricChangeType.Missing:
        return -1;
      case MetricChangeType.Fresh:
        return 1;
      default:
        return this.dst === 0 ? 0 : (this.src - this.dst) / this.dst;
    }
  }
}

/**
 * simple `date-fns` locale that uses the abbreviated form of duration units
 * such as `m` instead of `minutes`.
 */
function durationLocale(token: string, count: number) {
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
 * @param maxUnits maximum number of units to use in description
 */
export function transformDuration(input: number, maxUnits = 2): string {
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
    locale: { formatDistance: durationLocale }
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

export function initPerformance(metric: Metric) {
  const duration = metric.duration();

  // it is possible that the function is called with no metric or a
  // metric with no duration in which case we opt not to show any
  // information about the runtime duration of the test case.
  if (duration === 0) {
    return;
  }

  // if runtime duration is logged as less than 50 milliseconds, it
  // is likely so error-prone and noisy whose accurate reporting or
  // comparison is of no value. In this case, we choose to report it
  // simply as less than 50 milliseconds to distinguish this case
  // from cases with no duration.
  if (duration < 50) {
    return '<50ms';
  }

  const changeType = metric.changeType();
  const durationStr = transformDuration(duration);
  if (
    changeType === MetricChangeType.Same ||
    changeType === MetricChangeType.Fresh ||
    changeType === MetricChangeType.Missing
  ) {
    return durationStr;
  }
  const change = metric.changeDescription();
  const sign = changeType === MetricChangeType.Faster ? 'faster' : 'slower';
  return change === 'same'
    ? `${durationStr} (${change})`
    : `${durationStr} (${change} ${sign})`;
}
