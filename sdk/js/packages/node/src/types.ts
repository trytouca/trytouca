// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Builder, createLong } from 'flatbuffers';
import * as schema from './schema';

/**
 *
 */
export interface ToucaType {
  json(): boolean | number | string;
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
export class NumberType implements ToucaType {
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
  private _value: ToucaType[];
  constructor(value: ToucaType[] = []) {
    this._value = value;
  }
  public add(value: ToucaType): void {
    this._value.push(value);
  }
  public json(): string {
    return JSON.stringify(this._value.map((v) => v.json()));
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
  constructor(private readonly value: Record<string, unknown>) {}
  public json(): string {
    return JSON.stringify(this.value);
  }
  public serialize(builder: Builder): number {
    return new BoolType(false).serialize(builder);
  }
}

/**
 *
 */
export class TypeHandler {
  private readonly _primitives: Record<string, (x: unknown) => ToucaType> = {
    boolean: (x) => new BoolType(x as boolean),
    number: (x) => new NumberType(x as number),
    string: (x) => new StringType(x as string)
  };
  private _types = new Map<string, () => Record<string, unknown>>([]);

  /**
   *
   */
  public transform(value: unknown): ToucaType {
    if (typeof value in this._primitives) {
      return this._primitives[typeof value](value);
    }
    if (Array.isArray(value)) {
      const vec = new VectorType();
      for (const v of value) {
        vec.add(this.transform(v));
      }
      return vec;
    }
    return new ObjectType(value as Record<string, unknown>);
  }

  /**
   *
   */
  public add_serializer(
    datatype: string,
    serializer: () => Record<string, unknown>
  ): void {
    this._types.set(datatype, serializer);
  }
}
