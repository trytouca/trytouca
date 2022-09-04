// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  Array as Array_,
  Bool,
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
  : never

function unwrap<T extends WrappedType>(wrapper: TypeWrapper): UnwrappedType<T> {
  switch (wrapper.valueType()) {
    case Type.Bool: {
      let unwrappedValue = wrapper.value(new Bool()) as Bool
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Int: {
      let unwrappedValue = wrapper.value(new Int()) as Int
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.UInt: {
      let unwrappedValue = wrapper.value(new UInt()) as UInt
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Float: {
      let unwrappedValue = wrapper.value(new Float()) as Float
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Double: {
      let unwrappedValue = wrapper.value(new Double()) as Double
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.String: {
      let unwrappedValue = wrapper.value(new String_()) as String_
      let value = unwrappedValue.value()
      return value as UnwrappedType<T>
    }

    case Type.Object_: {
      let unwrappedObject = wrapper.value(new Object_()) as Object_
      let length = unwrappedObject.valuesLength()
      let entries = Array.from({ length }, (_, i) => {
        let unwrappedMember = unwrappedObject.values(i)!
        let key = unwrappedMember.name()!
        let valueWrapper = unwrappedMember.value()!
        let value = unwrap(valueWrapper)
        return [key, value]
      })
      let object = Object.fromEntries(entries) as UnwrappedType<T>
      return object
    }

    case Type.Array: {
      let unwrappedArray = wrapper.value(new Array_()) as Array_
      let length = unwrappedArray.valuesLength()
      let array = Array.from({ length }, (_, i) => {
        let valueWrapper = unwrappedArray.values(i)!
        let value = unwrap(valueWrapper)
        return value
      })
      return array as UnwrappedType<T>
    }

    default:
      throw new TypeError('unknown type')
  }
}

export { unwrap }
