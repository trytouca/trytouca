// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

/**
 *
 */
export enum MetricChangeType {
  Missing = 1,
  Slower,
  Same,
  Faster,
  Fresh
}

/**
 *
 */
export class Metric {
  constructor(
    readonly name: string,
    readonly src: number | null,
    readonly dst: number | null
  ) {}

  /**
   *
   */
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
    const score = this.score();
    if (score === 0) {
      return 'same';
    }
    const abs = Math.abs(score);
    if (abs < 2) {
      return `${Math.floor(abs * 100) / 1}%`;
    }
    return `${Math.floor(abs)}x`;
  }

  public duration(): number {
    return this.src === null ? this.dst : this.src;
  }

  public absoluteDifference(): number {
    return Math.abs(this.src - this.dst);
  }

  public score(): number {
    const sign = this.src < this.dst ? -1 : +1;
    switch (this.changeType()) {
      case MetricChangeType.Missing:
        return -1;
      case MetricChangeType.Fresh:
        return 1;
      default:
        if (this.dst === 0) {
          return 0;
        }
        return (this.absoluteDifference() * sign) / this.dst;
    }
  }
}
