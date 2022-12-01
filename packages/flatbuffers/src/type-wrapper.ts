// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  Array as Array_,
  Blob,
  Bool,
  ComparisonRuleDouble,
  ComparisonRuleMode,
  Double,
  Float,
  Int,
  Object_,
  String as String_,
  UInt,
  Type,
  TypeWrapper
} from './schema/generated/root'

type DataType =
  | boolean
  | bigint
  | number
  | string
  | Array<Type>
  | Buffer
  | { [key: string]: Type }

type WrappedType =
  | 'Bool'
  | 'Int'
  | 'UInt'
  | 'Float'
  | 'Double'
  | 'String'
  | 'Object'
  | 'Array'
  | 'Blob'

type UnwrappedType<T extends WrappedType> = T extends 'Bool'
  ? boolean
  : T extends 'Int'
  ? bigint
  : T extends 'UInt'
  ? bigint
  : T extends 'Float'
  ? number
  : T extends 'Double'
  ? number
  : T extends 'String'
  ? string
  : T extends 'Object'
  ? { [key: string]: DataType }
  : T extends 'Array'
  ? Array<DataType>
  : T extends 'Blob'
  ? Buffer
  : never

type RuleDouble =
  | { type: 'number'; mode: 'absolute'; max?: number; min?: number }
  | { type: 'number'; mode: 'relative'; max?: number; percent?: boolean }

export type Rule = RuleDouble

type UnwrappedRule<T extends WrappedType> = T extends 'Double'
  ? RuleDouble
  : never

function makeRuleDouble(rule: ComparisonRuleDouble): RuleDouble {
  const mode = rule.mode()
  const max = rule.max() === null ? undefined : rule.max()!
  const min = rule.min() === null ? undefined : rule.min()!
  if (mode === ComparisonRuleMode.Absolute) {
    return { type: 'number', mode: 'absolute', min, max }
  }
  const percent = rule.percent() === null ? undefined : rule.percent()!
  return { type: 'number', mode: 'relative', max, percent }
}

export function unwrapRule<T extends WrappedType>(
  wrapper: TypeWrapper
): UnwrappedRule<T> | undefined {
  switch (wrapper.valueType()) {
    case Type.Double: {
      const unwrappedValue = wrapper.value(new Double()) as Double
      const rule = unwrappedValue.rule()
      const out = rule ? makeRuleDouble(rule) : undefined
      return out as UnwrappedRule<T>
    }
  }
}

export function unwrapValue<T extends WrappedType>(
  wrapper: TypeWrapper
): UnwrappedType<T> {
  switch (wrapper.valueType()) {
    case Type.Bool: {
      const unwrappedValue = wrapper.value(new Bool()) as Bool
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Int: {
      const unwrappedValue = wrapper.value(new Int()) as Int
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.UInt: {
      const unwrappedValue = wrapper.value(new UInt()) as UInt
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Float: {
      const unwrappedValue = wrapper.value(new Float()) as Float
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Double: {
      const unwrappedValue = wrapper.value(new Double()) as Double
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.String: {
      const unwrappedValue = wrapper.value(new String_()) as String_
      const value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Object_: {
      const unwrappedObject = wrapper.value(new Object_()) as Object_
      const length = unwrappedObject.valuesLength()
      const entries = Array.from({ length }, (_, i) => {
        const unwrappedMember = unwrappedObject.values(i)!
        const key = unwrappedMember.name()!
        const valueWrapper = unwrappedMember.value()!
        const value = unwrapValue(valueWrapper)
        return [key, value]
      })
      const key = unwrappedObject.key()!
      return { [key]: Object.fromEntries(entries) } as UnwrappedType<T>
    }

    case Type.Array: {
      const unwrappedArray = wrapper.value(new Array_()) as Array_
      const length = unwrappedArray.valuesLength()
      const array = Array.from({ length }, (_, i) => {
        const valueWrapper = unwrappedArray.values(i)!
        const value = unwrapValue(valueWrapper)
        return value
      })
      return array as UnwrappedType<T>
    }

    case Type.Blob: {
      const unwrappedValue = wrapper.value(new Blob()) as Blob
      const value = Buffer.from(unwrappedValue.digest()!, 'utf-8')
      return value as UnwrappedType<T>
    }

    default:
      throw new TypeError('unknown type')
  }
}
