// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from 'vitest'
import { TypeComparison, compare } from './type'

describe('boolean', () => {
  test('equal', () => {
    expect(compare(false, false)).toEqual<TypeComparison>({
      srcType: 'bool',
      srcValue: 'false',
      score: 1,
      desc: []
    })
  })

  test('nonequal', () => {
    expect(compare(false, true)).toEqual<TypeComparison>({
      srcType: 'bool',
      srcValue: 'false',
      dstValue: 'true',
      score: 0,
      desc: []
    })
  })
})

describe('bigint', () => {
  test('equal', () => {
    expect(compare(0n, 0n)).toEqual<TypeComparison>({
      srcType: 'number',
      srcValue: '0',
      score: 1,
      desc: []
    })
  })

  test('nonequal', () => {
    expect(compare(1n, 2n)).toEqual<TypeComparison>({
      srcType: 'number',
      srcValue: '1',
      dstValue: '2',
      score: 0,
      desc: []
    })
  })
})

describe('number', () => {
  test('equal', () => {
    expect(compare(0, 0)).toEqual<TypeComparison>({
      srcType: 'number',
      srcValue: '0',
      score: 1,
      desc: []
    })
  })

  test('nonequal', () => {
    expect(compare(1, 2)).toEqual<TypeComparison>({
      srcType: 'number',
      srcValue: '1',
      dstValue: '2',
      score: 0,
      desc: []
    })
  })
})

describe('string', () => {
  test('equal', () => {
    expect(compare('bar', 'bar')).toEqual<TypeComparison>({
      srcType: 'string',
      srcValue: '"bar"',
      score: 1,
      desc: []
    })
  })

  test('nonequal', () => {
    expect(compare('bar', 'baz')).toEqual<TypeComparison>({
      srcType: 'string',
      dstValue: '"baz"',
      srcValue: '"bar"',
      score: 0,
      desc: []
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
      dict: {
        day: 30,
        month: 6,
        year: 1996
      }
    }
    const dst = {
      dict: {
        day: 30,
        month: 12,
        year: 1996
      }
    }
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      dstValue: '{"dict":{"day":30,"month":12,"year":1996}}',
      score: 2 / 3,
      srcType: 'object',
      srcValue: '{"dict":{"day":30,"month":6,"year":1996}}'
    })
  })
})

describe('array', () => {
  test('flat', () => {
    expect(compare(['foo', 'bar'], ['foo', 'bar'])).toEqual<TypeComparison>({
      srcType: 'array',
      srcValue: '["foo","bar"]',
      score: 1,
      desc: []
    })
  })

  test('nested', () => {
    const src = [
      42,
      ['foo', 'bar'],
      {
        qux: ['qux']
      }
    ]
    const dst = [
      42,
      ['foo', 'baz'],
      {
        qux: ['quux']
      }
    ]
    expect(compare(src, dst)).toEqual<TypeComparison>({
      srcType: 'array',
      srcValue: '[42,["foo","bar"],{"qux":["qux"]}]',
      dstValue: '[42,["foo","baz"],{"qux":["quux"]}]',
      score: 2 / 4,
      desc: []
    })
  })
})

test('incompatible', () => {
  expect(compare({}, [])).toEqual<TypeComparison>({
    srcType: 'object',
    srcValue: '{}',
    dstType: 'array',
    dstValue: '[]',
    score: 0,
    desc: []
  })
})
