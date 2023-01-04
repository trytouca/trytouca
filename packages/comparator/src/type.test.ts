// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from 'vitest'
import { TypeComparison, compare } from './type'

describe('boolean', () => {
  test('equal', () => {
    expect(compare(false, false)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'bool',
      srcValue: 'false',
    })
  })

  test('nonequal', () => {
    expect(compare(false, true)).toEqual<TypeComparison>({
      desc: [],
      diff: { __old: false, __new: true },
      diffString: '-false\n+true\n',
      dstValue: 'true',
      score: 0,
      srcType: 'bool',
      srcValue: 'false',
    })
  })
})

describe('bigint', () => {
  test('equal', () => {
    expect(compare(0n, 0n)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'number',
      srcValue: '0',
    })
  })

  test('nonequal', () => {
    expect(compare(1n, 2n)).toEqual<TypeComparison>({
      desc: [],
      diff: { __old: '1', __new: '2' },
      diffString: '-1\n+2\n',
      score: 0,
      srcType: 'number',
      srcValue: '1',
      dstValue: '2',
    })
  })
})

describe('number', () => {
  test('equal', () => {
    expect(compare(0, 0)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'number',
      srcValue: '0',
    })
  })

  test('nonequal', () => {
    expect(compare(1, 2)).toEqual<TypeComparison>({
      desc: [],
      diff: { __old: 1, __new: 2 },
      diffString: '-1\n+2\n',
      score: 0,
      srcType: 'number',
      srcValue: '1',
      dstValue: '2',
    })
  })
})

describe('string', () => {
  test('equal', () => {
    const src = 'bar'
    const dst = src
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'string',
      srcValue: '"bar"',
    })
  })

  test('nonequal', () => {
    const src = 'foo bar qux'
    const dst = 'baz quux'
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      diff: [
        [-1, 'foo '],
        [0, 'ba'],
        [-1, 'r'],
        [1, 'z'],
        [0, ' qu'],
        [1, 'u'],
        [0, 'x'],
      ],
      diffString: '@@ -1,11 +1,8 @@\n-foo \n ba\n-r\n+z\n  qu\n+u\n x\n',
      distance: 0.45,
      score: 0,
      srcType: 'string',
      srcValue: '"foo bar qux"',
      dstValue: '"baz quux"',
    })
  })
})

describe('object', () => {
  test('equal', () => {
    const src = { foo: 'bar' }
    const dst = src
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'object',
      srcValue: '{"foo":"bar"}',
    })
  })

  test('nonequal', () => {
    const src = {
      dict: { day: 30, month: 6, year: 1996 },
    }
    const dst = {
      dict: { year: 1996, day: 30, month: 12 },
    }
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      diff: {
        dict: { month: { __new: 12, __old: 6 } },
      },
      diffString:
        ' {\n   dict: {\n     day: 30\n-    month: 6\n+    month: 12\n     year: 1996\n   }\n }\n',
      score: 2 / 3,
      srcType: 'object',
      srcValue: '{"dict":{"day":30,"month":6,"year":1996}}',
      dstValue: '{"dict":{"day":30,"month":12,"year":1996}}',
    })
  })
})

describe('array', () => {
  test('flat', () => {
    const src = ['foo', 'bar']
    const dst = src
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      score: 1,
      srcType: 'array',
      srcValue: '["foo","bar"]',
    })
  })

  test('nested', () => {
    const src = [42, ['foo', 'bar'], { qux: ['qux'] }]
    const dst = [42, ['foo', 'baz'], { qux: ['quux'] }]
    expect(compare(src, dst)).toEqual<TypeComparison>({
      desc: [],
      diff: [
        [' '],
        ['~', [[' '], ['-', 'bar'], ['+', 'baz']]],
        [
          '~',
          {
            qux: [
              ['-', 'qux'],
              ['+', 'quux'],
            ],
          },
        ],
      ],
      diffString:
        ' [\n   42\n   [\n     "foo"\n-    "bar"\n+    "baz"\n   ]\n   {\n     qux: [\n-      "qux"\n+      "quux"\n     ]\n   }\n ]\n',
      score: 2 / 4,
      srcType: 'array',
      srcValue: '[42,["foo","bar"],{"qux":["qux"]}]',
      dstValue: '[42,["foo","baz"],{"qux":["quux"]}]',
    })
  })
})

test('incompatible', () => {
  expect(compare({}, [])).toEqual<TypeComparison>({
    desc: [],
    diff: { __old: {}, __new: [] },
    diffString: '-{\n-}\n+[\n+]\n',
    score: 0,
    srcType: 'object',
    srcValue: '{}',
    dstType: 'array',
    dstValue: '[]',
  })
})
