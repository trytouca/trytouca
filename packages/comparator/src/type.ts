// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Buffer } from 'node:buffer'
import { Decimal } from 'decimal.js'
import { diff_match_patch } from 'diff-match-patch'
import * as jsonDiff from 'json-diff'
import { stringify } from 'safe-stable-stringify'
import type { Message } from '@touca/flatbuffers'
import { checkRuleNumber } from './rules'

type Type = Message['results'][0]['value']
type Rule = Message['results'][0]['rule']

type TypeComparison = {
  desc: Array<string>
  diff?: any
  diffString?: string
  distance?: number
  dstType?: string
  dstValue?: string
  rule?: Rule
  score: number
  srcType: string
  srcValue: string
}

function getTypeName(value: Type) {
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
      return Array.isArray(value)
        ? 'array'
        : Buffer.isBuffer(value)
        ? 'buffer'
        : 'object'
    default:
      return 'unknown'
  }
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
    for (const [key, value] of Object.entries(input).sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
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

function compare(src: Type, dst: Type, rule?: Rule): TypeComparison {
  const cmp: TypeComparison = {
    srcType: getTypeName(src),
    srcValue: Buffer.isBuffer(src) ? src.toString() : stringify(src)!,
    desc: [],
    score: 0,
  }

  if (Buffer.isBuffer(src) && Buffer.isBuffer(dst)) {
    const match = !src.compare(dst)
    return match ? { ...cmp, score: 1 } : { ...cmp, dstValue: dst.toString() }
  }

  if (isBoolean(src) && isBoolean(dst)) {
    const match = src == dst
    const diff = jsonDiff.diff(src, dst)
    const diffString = jsonDiff.diffString(src, dst, {
      full: true,
      color: false,
    })
    return match
      ? { ...cmp, score: 1 }
      : { ...cmp, dstValue: stringify(dst), diff, diffString }
  }

  if (isBigInt(src) && isBigInt(dst)) {
    const RATIO_THRESHOLD = 0.2
    const x = new Decimal(src.toString())
    const y = new Decimal(dst.toString())
    const difference = x.minus(y)
    if (difference.isZero()) {
      return { ...cmp, score: 1 }
    }
    const ratio = y.equals(0) ? 0 : difference.div(y).abs().toNumber()
    if (0 < ratio && ratio < RATIO_THRESHOLD) {
      return { ...cmp, score: 1 - ratio, dstValue: stringify(dst) }
    }
    const srcValue = stringify(src)!
    const dstValue = stringify(dst)!
    const diff = jsonDiff.diff(srcValue, dstValue)
    const diffString = jsonDiff
      .diffString(srcValue, dstValue, { full: true, color: false })
      .replaceAll('"', '')
    return { ...cmp, dstValue, diff, diffString }
  }

  if (isNumber(src) && isNumber(dst)) {
    const difference = src - dst
    if (difference === 0) {
      return { ...cmp, score: 1 }
    }
    const ratio = dst === 0 ? 0 : Math.abs(difference / dst)
    const dstValue = stringify(dst)
    const diff = jsonDiff.diff(src, dst)
    const diffString = jsonDiff.diffString(src, dst, {
      full: true,
      color: false,
    })
    return rule
      ? {
          ...cmp,
          dstValue,
          rule,
          ...checkRuleNumber(src, dst, rule),
          diff,
          diffString,
        }
      : 0 < ratio && ratio < 0.2
      ? { ...cmp, score: 1 - ratio, dstValue, diff, diffString }
      : { ...cmp, dstValue, diff, diffString }
  }

  if (isString(src) && isString(dst)) {
    const dmp = new diff_match_patch()
    const diff = dmp.diff_main(src, dst)
    dmp.diff_cleanupSemantic(diff)
    const diffString = dmp.patch_toText(dmp.patch_make(diff))
    const normalizedDistance =
      1 - dmp.diff_levenshtein(diff) / Math.max(src.length, dst.length)
    const distance = Number.parseFloat(normalizedDistance.toFixed(2))
    const match = src === dst
    return match
      ? { ...cmp, score: 1 }
      : {
          ...cmp,
          dstValue: stringify(dst),
          score: 0,
          diff,
          diffString,
          distance,
        }
  }

  if (isObject(src) && isObject(dst)) {
    const flatSrc = flatten(Object.values(src))
    const flatDst = flatten(Object.values(dst))
    let common = 0
    let total = 0
    for (const [key, value] of flatSrc) {
      total += 1
      if (flatDst.has(key)) {
        const result = compare(value, flatDst.get(key)!)
        common += result.score
      }
    }
    for (const key of flatDst.keys()) {
      if (!flatSrc.has(key)) {
        total += 1
      }
    }
    const score = total !== 0 ? common / total : 0
    const diff = jsonDiff.diff(src, dst)
    const diffString = jsonDiff.diffString(src, dst, {
      full: true,
      color: false,
    })
    return common === total
      ? { ...cmp, score }
      : {
          ...cmp,
          score,
          dstValue: stringify(dst),
          diff,
          diffString,
        }
  }

  if (isArray(src) && isArray(dst)) {
    const RATIO_THRESHOLD = 0.2
    const COUNT_THRESHOLD = 10
    const flatSrc = Array.from(flatten(src).values())
    const flatDst = Array.from(flatten(dst).values())
    const minLength = Math.min(flatSrc.length, flatDst.length)
    const maxLength = Math.max(flatSrc.length, flatDst.length)
    if (maxLength === 0) {
      return { ...cmp, score: 1 }
    }
    const ratio = (maxLength - minLength) / maxLength
    if (ratio > RATIO_THRESHOLD || flatSrc.length === 0) {
      return { ...cmp, dstValue: stringify(dst) }
    }
    let commonCount = 0
    let diffCount = 0
    let score = 0
    for (let i = 0; i < minLength; i++) {
      const result = compare(flatSrc[i]!, flatDst[i]!)
      commonCount += result.score
      if (result.score !== 1) {
        diffCount += 1
      }
    }
    const diffRatio = flatSrc.length !== 0 ? diffCount / flatSrc.length : 0
    if (diffRatio < RATIO_THRESHOLD || diffCount < COUNT_THRESHOLD) {
      score = commonCount / maxLength
    }
    const diff = jsonDiff.diff(src, dst)
    const diffString = jsonDiff.diffString(src, dst, {
      full: true,
      color: false,
    })
    const match = score === 1
    return match
      ? { ...cmp, score }
      : { ...cmp, score, dstValue: stringify(dst), diff, diffString }
  }

  const diff = jsonDiff.diff(src, dst)
  const diffString = jsonDiff.diffString(src, dst, {
    full: true,
    color: false,
  })
  return {
    ...cmp,
    dstType: getTypeName(dst),
    dstValue: stringify(dst),
    diff,
    diffString,
  }
}

export { Type, TypeComparison, compare, getTypeName, stringify }
