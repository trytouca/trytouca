// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { IntegerType, NumberType, ToucaType, VectorType } from './types';
import { Builder } from 'flatbuffers';
import * as schema from './schema';

enum ResultCategory {
  Check = 1,
  Assert
}

type ResultEntry = {
  typ: ResultCategory;
  val: ToucaType;
};

type ResultValueType = boolean | number | string;

type CppTestcaseMetadata = {
  builtAt: string;
  testcase: string;
  testsuite: string;
  teamslug: string;
  version: string;
};

type CaseJson = {
  metadata: CppTestcaseMetadata;
  results: { key: string; value: ResultValueType }[];
  assertions: { key: string; value: ResultValueType }[];
  metrics: { key: string; value: ResultValueType }[];
};

/**
 *
 */
export class Case {
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
  ) {}

  /**
   * Logs a given value as a test result for the declared test case
   * and associates it with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  add_result(key: string, value: ToucaType): void {
    this._results.set(key, { typ: ResultCategory.Check, val: value });
  }

  /**
   * Logs a given value as an assertion for the declared test case
   * and associates it with the specified key.
   *
   * @param key name to be associated with the logged test result
   * @param value value to be logged as a test result
   */
  add_assertion(key: string, value: ToucaType): void {
    this._results.set(key, { typ: ResultCategory.Assert, val: value });
  }

  /**
   *
   */
  add_array_element(key: string, value: ToucaType): void {
    if (!this._results.has(key)) {
      this._results.set(key, {
        typ: ResultCategory.Check,
        val: new VectorType()
      });
    }
    const val = this._results.get(key) as ResultEntry;
    if (val.typ !== ResultCategory.Check || !(val.val instanceof VectorType)) {
      throw new Error('specified key has a different type');
    }
    val.val.add(value);
  }

  /**
   *
   */
  add_hit_count(key: string): void {
    if (!this._results.has(key)) {
      this._results.set(key, {
        typ: ResultCategory.Check,
        val: new NumberType(1)
      });
      return;
    }
    const val = this._results.get(key) as ResultEntry;
    if (val.typ !== ResultCategory.Check || !(val.val instanceof NumberType)) {
      throw new Error('specified key has a different type');
    }
    val.val.increment();
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
      const diff = new IntegerType(toc - tic);
      metrics.push([key, diff]);
    }
    return metrics;
  }

  /**
   *
   */
  private _metadata(): CppTestcaseMetadata {
    return {
      teamslug: this.meta.team ?? 'unknown',
      testsuite: this.meta.suite ?? 'unknown',
      version: this.meta.version ?? 'unknown',
      testcase: this.meta.name,
      builtAt: new Date().toUTCString()
    };
  }

  /**
   *
   */
  json(): CaseJson {
    const results = [];
    const assertions = [];
    for (const [key, entry] of this._results.entries()) {
      const item = { key, value: entry.val.json() };
      switch (entry.typ) {
        case ResultCategory.Assert:
          assertions.push(item);
          break;
        default:
          results.push(item);
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

  /**
   *
   */
  serialize(): Uint8Array {
    const result_types = new Map<ResultCategory, schema.ResultType>([
      [ResultCategory.Check, schema.ResultType.Check],
      [ResultCategory.Assert, schema.ResultType.Assert]
    ]);
    const builder = new Builder(1024);

    const meta = this._metadata();
    const keys = Object.keys(meta) as (keyof CppTestcaseMetadata)[];
    const metadata = new Map<string, number>(
      keys.map((k) => [k, builder.createString(meta[k])])
    );
    schema.Metadata.startMetadata(builder);
    schema.Metadata.addTeamslug(builder, metadata.get('teamslug') as number);
    schema.Metadata.addTestsuite(builder, metadata.get('testsuite') as number);
    schema.Metadata.addVersion(builder, metadata.get('version') as number);
    schema.Metadata.addTestcase(builder, metadata.get('testcase') as number);
    schema.Metadata.addBuiltAt(builder, metadata.get('builtAt') as number);
    const fbs_metadata = schema.Metadata.endMetadata(builder);

    const result_entries = [];
    for (const [k, v] of this._results) {
      const fbs_key = builder.createString(k);
      const fbs_value = v.val.serialize(builder);
      schema.Result.startResult(builder);
      schema.Result.addKey(builder, fbs_key);
      schema.Result.addValue(builder, fbs_value);
      schema.Result.addTyp(
        builder,
        result_types.get(v.typ) as schema.ResultType
      );
      result_entries.push(schema.Result.endResult(builder));
    }
    const fbs_result_entries = schema.Results.createEntriesVector(
      builder,
      result_entries
    );
    schema.Results.startResults(builder);
    schema.Results.addEntries(builder, fbs_result_entries);
    const fbs_results = schema.Results.endResults(builder);

    const metric_entries: number[] = [];
    for (const [k, v] of this._metrics()) {
      const fbs_key = builder.createString(k);
      const fbs_value = v.serialize(builder);
      schema.Metric.startMetric(builder);
      schema.Metric.addKey(builder, fbs_key);
      schema.Metric.addValue(builder, fbs_value);
      metric_entries.push(schema.Metric.endMetric(builder));
    }
    const fbs_metric_entries = schema.Metrics.createEntriesVector(
      builder,
      metric_entries
    );
    schema.Metrics.startMetrics(builder);
    schema.Metrics.addEntries(builder, fbs_metric_entries);
    const fbs_metrics = schema.Metrics.endMetrics(builder);

    schema.Message.startMessage(builder);
    schema.Message.addMetadata(builder, fbs_metadata);
    schema.Message.addResults(builder, fbs_results);
    schema.Message.addMetrics(builder, fbs_metrics);
    const fbs_message = schema.Message.endMessage(builder);

    builder.finish(fbs_message);
    return builder.asUint8Array();
  }
}
