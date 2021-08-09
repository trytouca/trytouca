// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NumberType, ToucaType, VectorType } from './types';

enum ResultValueType {
  Check = 1,
  Assert
}

type ResultEntry = {
  typ: ResultValueType;
  val: ToucaType;
};

/**
 *
 */
export class Case {
  private _meta: Record<string, string> = {};
  private _results = new Map<string, ResultEntry>();
  private _tics = new Map<string, number>();
  private _tocs = new Map<string, number>();

  /**
   *
   */
  constructor(
    private readonly meta: {
      name: string;
      team?: string;
      suite?: string;
      version?: string;
    }
  ) {
    this._meta;
  }

  /**
   * Logs a given value as a test result for the declared test case
   * and associates it with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  add_result(key: string, value: ToucaType): void {
    this._results.set(key, { typ: ResultValueType.Check, val: value });
  }

  /**
   * Logs a given value as an assertion for the declared test case
   * and associates it with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  add_assertion(key: string, value: ToucaType): void {
    this._results.set(key, { typ: ResultValueType.Assert, val: value });
  }

  /**
   *
   */
  add_array_element(key: string, value: ToucaType): void {
    if (!this._results.has(key)) {
      this._results.set(key, {
        typ: ResultValueType.Check,
        val: new VectorType()
      });
    }
    const vec = this._results.get(key);
    if (
      vec?.typ !== ResultValueType.Check ||
      !(vec.val instanceof VectorType)
    ) {
      throw new Error('specified key has a different type');
    }
    vec.val.add(value);
  }

  /**
   *
   */
  add_hit_count(key: string): void {
    if (!this._results.has(key)) {
      this._results.set(key, {
        typ: ResultValueType.Check,
        val: new NumberType(1)
      });
      return;
    }
    const value = this._results.get(key);
    if (
      value?.typ !== ResultValueType.Check ||
      !(value.val instanceof NumberType)
    ) {
      throw new Error('specified key has a different type');
    }
    value.val.increment();
  }

  /**
   *
   */
  add_metric(key: string, milliseconds: number): void {
    const now = new Date();
    this._tics.set(key, now.getTime());
    now.setMilliseconds(now.getMilliseconds() + milliseconds);
    this._tocs.set(key, now.getTime());
  }

  /**
   *
   */
  start_timer(key: string): void {
    this._tics.set(key, new Date().getTime());
  }

  /**
   *
   */
  stop_timer(key: string): void {
    if (this._tics.has(key)) {
      this._tocs.set(key, new Date().getTime());
    }
  }

  /**
   *
   */
  private _metrics(): [string, ToucaType][] {
    const metrics: [string, ToucaType][] = [];
    for (const [key, tic] of this._tics) {
      if (!this._tocs.has(key)) {
        continue;
      }
      const toc = this._tocs.get(key) as number;
      const diff = new NumberType(toc - tic);
      metrics.push([key, diff]);
    }
    return metrics;
  }

  /**
   *
   */
  private _metadata(): Record<string, string> {
    return {
      teamslug: this.meta.team ?? 'unknown',
      testsuite: this.meta.suite ?? 'unknown',
      version: this.meta.version ?? 'unknown',
      testcase: this.meta.name ?? 'unknown',
      builtAt: new Date().toUTCString()
    };
  }

  /**
   *
   */
  json(): Record<string, unknown> {
    const results = [];
    const assertions = [];
    for (const [key, entry] of this._results.entries()) {
      const item = { key, value: entry.val.json() };
      if (entry.typ === ResultValueType.Assert) {
        results.push(item);
      } else {
        assertions.push(item);
      }
    }
    const metrics = this._metrics().map((kvp) => ({
      key: kvp[0],
      value: kvp[1].json()
    }));
    return {
      metadata: this._metadata(),
      results,
      assertions,
      metrics
    };
  }
}
