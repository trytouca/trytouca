// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from 'vitest'
import { TypeComparison, compare } from './type'

describe('boolean', () => {
  test('equal', () => {
    expect(compare(false, false)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'bool',
      srcValue: 'false'
    })
  })

  test('nonequal', () => {
    expect(compare(false, true)).toEqual<TypeComparison>({
      desc: [],
      dstValue: 'true',
      score: 0,
      srcType: 'bool',
      srcValue: 'false'
    })
  })
})

describe('bigint', () => {
  test('equal', () => {
    expect(compare(0n, 0n)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'number',
      srcValue: '0'
    })
  })

  test('nonequal', () => {
    expect(compare(1n, 2n)).toEqual<TypeComparison>({
      desc: [],
      score: 0,
      srcType: 'number',
      srcValue: '1',
      dstValue: '2'
    })
  })
})

describe('number', () => {
  test('equal', () => {
    expect(compare(0, 0)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'number',
      srcValue: '0'
    })
  })

  test('nonequal', () => {
    expect(compare(1, 2)).toEqual<TypeComparison>({
      desc: [],
      score: 0,
      srcType: 'number',
      srcValue: '1',
      dstValue: '2'
    })
  })
})

describe('string', () => {
  test('equal', () => {
    expect(compare('bar', 'bar')).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'string',
      srcValue: '"bar"'
    })
  })

  test('nonequal', () => {
    expect(compare('foo bar qux', 'baz quux')).toEqual<TypeComparison>({
      desc: [],
      score: 0.4545454545454546,
      srcType: 'string',
      srcValue: '"foo bar qux"',
      dstValue: '"baz quux"'
    })
  })
})

describe('object', () => {
  test('equal', () => {
    expect(compare({ foo: 'bar' }, { foo: 'bar' })).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'object',
      srcValue: '{"foo":"bar"}'
    })
  })

  test('nonequal', () => {
    const src = {
      dict: { day: 30, month: 6, year: 1996 }
    }
    const dst = {
      dict: { year: 1996, day: 30, month: 12 }
    }
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      score: 2 / 3,
      srcType: 'object',
      srcValue: '{"dict":{"day":30,"month":6,"year":1996}}',
      dstValue: '{"dict":{"day":30,"month":12,"year":1996}}'
    })
  })
})

describe('array', () => {
  test('flat', () => {
    expect(compare(['foo', 'bar'], ['foo', 'bar'])).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'array',
      srcValue: '["foo","bar"]'
    })
  })

  test('nested', () => {
    const src = [42, ['foo', 'bar'], { qux: ['qux'] }]
    const dst = [42, ['foo', 'baz'], { qux: ['quux'] }]
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      score: 0.8541666666666667,
      srcType: 'array',
      srcValue: '[42,["foo","bar"],{"qux":["qux"]}]',
      dstValue: '[42,["foo","baz"],{"qux":["quux"]}]'
    })
  })
})

test('incompatible', () => {
  expect(compare({}, [])).toEqual<TypeComparison>({
    desc: [],
    score: 0,
    srcType: 'object',
    srcValue: '{}',
    dstType: 'array',
    dstValue: '[]'
  })
})
