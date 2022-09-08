// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Message } from '@touca/flatbuffers'
import { describe, expect, test } from 'vitest'
import { compare, TestcaseComparison } from './testcase'

function createMessage(): Message {
  return {
    metadata: {
      teamslug: '',
      testsuite: '',
      version: '',
      testcase: '',
      builtAt: ''
    },
    metrics: [],
    results: []
  }
}

describe('testcase', () => {
  test('compare two empty messages', () => {
    const message = createMessage()
    const result = compare(message, message)
    expect(result.overview).toEqual<TestcaseComparison['overview']>({
      keysCountCommon: 0,
      keysCountFresh: 0,
      keysCountMissing: 0,
      keysScore: 1,
      metricsCountCommon: 0,
      metricsCountFresh: 0,
      metricsCountMissing: 0,
      metricsDurationCommonDst: 0,
      metricsDurationCommonSrc: 0
    })
    expect(result.body).toEqual<TestcaseComparison['body']>({
      src: message.metadata,
      dst: message.metadata,
      assertions: { commonKeys: [], newKeys: [], missingKeys: [] },
      results: { commonKeys: [], newKeys: [], missingKeys: [] },
      metrics: { commonKeys: [], newKeys: [], missingKeys: [] }
    })
  })
})
