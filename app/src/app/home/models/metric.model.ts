// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

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
      : `${multiple.toFixed(0)}x`;
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
