// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { readFileSync } from 'node:fs';

import { createHash } from 'crypto';
import { Builder } from 'flatbuffers';

import * as schema from './schema.js';

type ComparisonRuleDouble =
  | { type: 'number'; mode: 'absolute'; max?: number; min?: number }
  | { type: 'number'; mode: 'relative'; max?: number; percent?: boolean };
export type ComparisonRule = ComparisonRuleDouble;

export type ResultJson =
  | boolean
  | number
  | string
  | Record<string, unknown>
  | Array<ResultJson>;

type SerializeOptions = { rule?: ComparisonRule };

export interface ToucaType {
  json(): ResultJson;
  serialize(builder: Builder, options?: SerializeOptions): number;
}

export class BlobType implements ToucaType {
  private constructor(
    private readonly value:
      | { content: Buffer; digest: string; mimetype: string }
      | { reference: string; digest: string }
  ) {}

  public static fromFile(reference: string) {
    const content = readFileSync(reference);
    const digest = createHash('sha256').update(content).digest('hex');
    return new BlobType({ reference, digest });
  }

  public static fromBytes(content: Buffer) {
    const digest = createHash('sha256').update(content).digest('hex');
    return new BlobType({ content, digest, mimetype: 'image/jpg' });
  }

  public binary(): Buffer {
    return 'content' in this.value
      ? this.value.content
      : readFileSync(this.value.reference);
  }

  public json(): string {
    return 'reference' in this.value ? this.value.reference : 'binary';
  }

  public serialize(builder: Builder): number {
    const fbs = {
      digest: builder.createString(this.value.digest),
      mimetype:
        'reference' in this.value
          ? undefined
          : builder.createString(this.value.mimetype),
      reference:
        'reference' in this.value
          ? builder.createString(this.value.reference)
          : undefined
    };
    schema.Blob.startBlob(builder);
    if (fbs.digest) {
      schema.Blob.addDigest(builder, fbs.digest);
    }
    if (fbs.mimetype) {
      schema.Blob.addMimetype(builder, fbs.mimetype);
    }
    if (fbs.reference) {
      schema.Blob.addReference(builder, fbs.reference);
    }
    const value = schema.Blob.endBlob(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Blob);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

class BoolType implements ToucaType {
  constructor(private readonly value: boolean) {}

  public json(): boolean {
    return this.value;
  }

  public serialize(builder: Builder): number {
    schema.Bool.startBool(builder);
    schema.Bool.addValue(builder, this.value);
    const value = schema.Bool.endBool(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Bool);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

export class DecimalType implements ToucaType {
  private _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public json(): number {
    return this._value;
  }

  public serialize(builder: Builder, options?: SerializeOptions): number {
    const ruleOffset = this.serializeRule(builder, options?.rule);
    schema.Double.startDouble(builder);
    schema.Double.addValue(builder, this._value);
    if (ruleOffset) {
      schema.Double.addRule(builder, ruleOffset);
    }
    const value = schema.Double.endDouble(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Double);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }

  private serializeRule(builder: Builder, rule?: SerializeOptions['rule']) {
    if (!rule || rule.type !== 'number') {
      return;
    }
    const mode =
      rule.mode === 'absolute'
        ? schema.ComparisonRuleMode.Absolute
        : schema.ComparisonRuleMode.Relative;
    schema.ComparisonRuleDouble.startComparisonRuleDouble(builder);
    schema.ComparisonRuleDouble.addMode(builder, mode);
    if (rule.max !== undefined) {
      schema.ComparisonRuleDouble.addMax(builder, rule.max);
    }
    if (rule.mode === 'absolute' && rule.min !== undefined) {
      schema.ComparisonRuleDouble.addMin(builder, rule.min);
    }
    if (rule.mode === 'relative' && rule.percent !== undefined) {
      schema.ComparisonRuleDouble.addPercent(builder, rule.percent);
    }
    return schema.ComparisonRuleDouble.endComparisonRuleDouble(builder);
  }
}

export class IntegerType implements ToucaType {
  private _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public increment(): void {
    this._value += 1;
  }

  public json(): number {
    return this._value;
  }

  public serialize(builder: Builder): number {
    schema.Int.startInt(builder);
    schema.Int.addValue(builder, BigInt(this._value));
    const value = schema.Int.endInt(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Int);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

class StringType implements ToucaType {
  constructor(private readonly value: string) {}

  public json(): string {
    return this.value;
  }

  public serialize(builder: Builder): number {
    const content = builder.createString(this.value);
    schema.T_String.startString(builder);
    schema.T_String.addValue(builder, content);
    const value = schema.T_String.endString(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.String);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

export class VectorType implements ToucaType {
  private _value: ToucaType[] = [];

  public add(value: ToucaType): void {
    this._value.push(value);
  }

  public json(): ResultJson {
    return this._value.map((v) => v.json());
  }

  public serialize(builder: Builder): number {
    const items = this._value.map((v) => v.serialize(builder));
    const values = schema.Array.createValuesVector(builder, items);
    schema.Array.startArray(builder);
    schema.Array.addValues(builder, values);
    const value = schema.Array.endArray(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Array);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

class ObjectType implements ToucaType {
  private _values = new Map<string, ToucaType>();

  constructor(private readonly name: string) {}

  public add(key: string, value: ToucaType) {
    this._values.set(key, value);
  }

  public json(): ResultJson {
    const values: Record<string, unknown> = {};
    for (const [k, v] of this._values) {
      values[k] = v.json();
    }
    return values;
  }

  public serialize(builder: Builder): number {
    const fbs_name = builder.createString(this.name);
    const members = [];
    for (const [k, v] of Array.from(this._values.entries()).reverse()) {
      const member_key = builder.createString(k);
      const member_value = v.serialize(builder);
      schema.ObjectMember.startObjectMember(builder);
      schema.ObjectMember.addName(builder, member_key);
      schema.ObjectMember.addValue(builder, member_value);
      members.push(schema.ObjectMember.endObjectMember(builder));
    }
    const fbs_members = schema.T_Object.createValuesVector(builder, members);
    schema.T_Object.startObject(builder);
    schema.T_Object.addKey(builder, fbs_name);
    schema.T_Object.addValues(builder, fbs_members);
    const value = schema.T_Object.endObject(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Object);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

export class TypeHandler {
  private readonly _primitives: Record<string, (x: unknown) => ToucaType> = {
    boolean: (x) => new BoolType(x as boolean),
    number: (x) =>
      Number.isInteger(x) && !(x as number).toString().includes('.')
        ? new IntegerType(x as number)
        : new DecimalType(x as number),
    string: (x) => new StringType(x as string),
    undefined: (x) => new StringType('undefined')
  };
  private _types = new Map<string, (arg: unknown) => Record<string, unknown>>([
    ['Date', (x) => ({ v: (x as Date).toISOString() })]
  ]);

  public transform(value: unknown): ToucaType {
    if (typeof value in this._primitives) {
      return this._primitives[typeof value](value);
    }
    if (value === null) {
      return new StringType('null');
    }
    if (Buffer.isBuffer(value)) {
      return BlobType.fromBytes(value);
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    const name = (value as object).constructor.name;
    if (this._types.has(name)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.transform(this._types.get(name)!(value));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (value as any)[Symbol.iterator] === 'function') {
      const v_obj = value as Iterable<unknown>;
      const vec = new VectorType();
      for (const v of v_obj) {
        vec.add(this.transform(v));
      }
      return vec;
    }
    const v_obj = value as Record<string, unknown>;
    const obj = new ObjectType(name);
    for (const k in v_obj) {
      obj.add(k, this.transform(v_obj[k]));
    }
    return obj;
  }

  public add_serializer(
    datatype: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializer: (x: any) => any
  ): void {
    this._types.set(datatype, serializer);
  }
}
