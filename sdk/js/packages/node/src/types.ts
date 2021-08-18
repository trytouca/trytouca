// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Builder, createLong } from 'flatbuffers';

import * as schema from './schema';

export type ResultJson =
  | boolean
  | number
  | string
  | Record<string, unknown>
  | ResultJson[];

/**
 *
 */
export interface ToucaType {
  json(): ResultJson;
  serialize(builder: Builder): number;
}

/**
 *
 */
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

/**
 *
 */
export class DecimalType implements ToucaType {
  private _value: number;

  constructor(value: number) {
    this._value = value;
  }

  public json(): number {
    return this._value;
  }

  public serialize(builder: Builder): number {
    schema.Double.startDouble(builder);
    schema.Double.addValue(builder, this._value);
    const value = schema.Double.endDouble(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Double);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

/**
 *
 */
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
    schema.Int.addValue(builder, createLong(this._value, this._value));
    const value = schema.Int.endInt(builder);
    schema.TypeWrapper.startTypeWrapper(builder);
    schema.TypeWrapper.addValue(builder, value);
    schema.TypeWrapper.addValueType(builder, schema.Type.Int);
    return schema.TypeWrapper.endTypeWrapper(builder);
  }
}

/**
 *
 */
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

/**
 *
 */
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

/**
 *
 */
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

/**
 *
 */
export class TypeHandler {
  private readonly _primitives: Record<string, (x: unknown) => ToucaType> = {
    boolean: (x) => new BoolType(x as boolean),
    number: (x) => new DecimalType(x as number),
    string: (x) => new StringType(x as string),
    undefined: (x) => new StringType('undefined')
  };
  private _types = new Map<string, (arg: unknown) => Record<string, unknown>>([
    ['Date', (x) => ({ v: (x as Date).toISOString() })]
  ]);

  /**
   *
   */
  public transform(value: unknown): ToucaType {
    if (typeof value in this._primitives) {
      return this._primitives[typeof value](value);
    }
    if (value === null) {
      return new StringType('null');
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

  /**
   *
   */
  public add_serializer(
    datatype: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializer: (x: any) => Record<string, unknown>
  ): void {
    this._types.set(datatype, serializer);
  }
}
