// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

/**
 *
 */
export interface ToucaType {
  json(): boolean | number | string;
  serialize(): void;
}

/**
 *
 */
class BoolType implements ToucaType {
  constructor(private readonly value: boolean) {}
  public json(): boolean {
    return this.value;
  }
  public serialize() {
    return '';
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
  public serialize(): string {
    return '';
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
  public serialize(): string {
    return '';
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
  public serialize(): string {
    return '';
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
  public serialize(): string {
    return '';
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
