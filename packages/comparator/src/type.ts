// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Decimal } from 'decimal.js'

type Type =
  | boolean
  | bigint
  | number
  | string
  | Array<Type>
  | { [key: string]: Type }

type TypeComparison = {
  type:
    | 'boolean'
    | 'bigint'
    | 'number'
    | 'string'
    | 'array'
    | 'object'
    | 'incompatible'
  match: boolean
  score: number
}

export type CppTypeComparison = {
  desc: Array<string>
  dstType?: string
  dstValue?: string
  score: number
  srcType: string
  srcValue: string
}

export function getTypeName(value: Type) {
  switch (typeof value) {
    case 'boolean':
      return 'bool'
    case 'number':
      return 'number'
    case 'bigint':
      return 'number'
    case 'string':
      return 'string'
    case 'object':
      return Array.isArray(value) ? 'array' : 'object'
    default:
      return 'unknown'
  }
}

export function stringifyValue(value: Type): string {
  if (isArray(value)) {
    return `[${value.map(stringifyValue).join(',')}]`
  }
  if (isObject(value)) {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, stringifyValue(v)])
      )
    )
  }
  return value.toString()
}

function isBoolean(value: Type): value is boolean {
  return typeof value === 'boolean'
}

function isBigInt(value: Type): value is bigint {
  return typeof value === 'bigint'
}

function isNumber(value: Type): value is number {
  return typeof value === 'number'
}

function isString(value: Type): value is string {
  return typeof value === 'string'
}

function isArray(value: Type): value is Array<Type> {
  return Array.isArray(value)
}

function isObject(value: Type): value is Record<string, Type> {
  return value !== null && typeof value === 'object' && !isArray(value)
}

function flatten(input: Type): Map<string, Type> {
  const output = new Map<string, Type>()
  if (isObject(input)) {
    for (const [key, value] of Object.entries(input)) {
      const children = flatten(value)
      if (children.size > 0) {
        for (const [childKey, childValue] of children) {
          const separator = isArray(value) ? '' : '.'
          output.set(`${key}${separator}${childKey}`, childValue)
        }
      } else {
        output.set(key, value)
      }
    }
  } else if (isArray(input)) {
    for (const [index, value] of input.entries()) {
      const children = flatten(value)
      if (children.size > 0) {
        for (const [childKey, childValue] of children) {
          const separator = isArray(value) ? '' : '.'
          output.set(`[${index}]${separator}${childKey}`, childValue)
        }
      } else {
        output.set(`[${index}]`, value)
      }
    }
  }
  return output
}

function compare(left: Type, right: Type): CppTypeComparison {
  const cmp: CppTypeComparison = {
    srcType: getTypeName(left),
    srcValue: stringifyValue(left),
    desc: [],
    score: 0
  }

  if (isBoolean(left) && isBoolean(right)) {
    const match = left == right
    return match
      ? { ...cmp, score: 1 }
      : { ...cmp, dstValue: stringifyValue(right) }
  }

  if (isBigInt(left) && isBigInt(right)) {
    const RATIO_THRESHOLD = 0.2
    const x = new Decimal(left.toString())
    const y = new Decimal(right.toString())
    const difference = x.minus(y)
    const match = difference.isZero()
    const ratio = y.equals(0) ? 0 : difference.div(y).abs().toNumber()
    const score =
      !match || (ratio > 0 && ratio < RATIO_THRESHOLD) ? 1 - ratio : 1
    return match
      ? { ...cmp, score }
      : { ...cmp, score, dstValue: stringifyValue(right) }
  }

  if (isNumber(left) && isNumber(right)) {
    const RATIO_THRESHOLD = 0.2
    const difference = left - right
    const match = difference === 0
    const ratio = right === 0 ? 0 : Math.abs(difference / right)
    const score =
      !match || (ratio > 0 && ratio < RATIO_THRESHOLD) ? 1 - ratio : 1
    return match
      ? { ...cmp, score }
      : { ...cmp, score, dstValue: stringifyValue(right) }
  }

  if (isString(left) && isString(right)) {
    const match = left === right
    return match
      ? { ...cmp, score: 1 }
      : { ...cmp, dstValue: stringifyValue(right) }
  }

  if (isObject(left) && isObject(right)) {
    const flatLeft = flatten(left)
    const flatRight = flatten(right)
    let common = 0
    let total = 0
    for (const [key, value] of flatLeft) {
      total += 1
      if (flatRight.has(key)) {
        const result = compare(value, flatRight.get(key)!)
        common += result.score
      }
    }
    for (const key of flatRight.keys()) {
      if (!flatLeft.has(key)) {
        total += 1
      }
    }
    const match = common === total
    const score = common / total
    return match
      ? { ...cmp, score }
      : { ...cmp, dstValue: stringifyValue(right) }
  }

  if (isArray(left) && isArray(right)) {
    const RATIO_THRESHOLD = 0.2
    const COUNT_THRESHOLD = 10
    const flatLeft = Array.from(flatten(left).values())
    const flatRight = Array.from(flatten(right).values())
    const minLength = Math.min(flatLeft.length, flatRight.length)
    const maxLength = Math.max(flatLeft.length, flatRight.length)
    if (maxLength === 0) {
      return { ...cmp, score: 1 }
    }
    const ratio = (maxLength - minLength) / maxLength
    if (ratio > RATIO_THRESHOLD || flatLeft.length === 0) {
      return { ...cmp }
    }
    let commonCount = 0
    let diffCount = 0
    let score = 0
    for (let i = 0; i < minLength; i++) {
      const result = compare(flatLeft[i]!, flatRight[i]!)
      commonCount += result.score
      if (result.score !== 1) {
        diffCount += 1
      }
    }
    const diffRatio = diffCount / flatLeft.length
    if (diffRatio < RATIO_THRESHOLD || diffCount < COUNT_THRESHOLD) {
      score = commonCount / maxLength
    }
    const match = score === 1
    return match
      ? { ...cmp, score }
      : { ...cmp, dstValue: stringifyValue(right) }
  }

  return {
    ...cmp,
    dstType: getTypeName(right),
    dstValue: stringifyValue(right)
  }
}

export { Type, TypeComparison, compare }
