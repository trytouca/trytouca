// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Message, ResultType } from '@touca/flatbuffers'
import { stringify } from 'safe-stable-stringify'
import { getTypeName, TypeComparison, compare as compareTypes } from './type'

type Cell = { name: string } & Partial<TypeComparison>

type Cellar = {
  commonKeys: Array<Cell>
  missingKeys: Array<Cell>
  newKeys: Array<Cell>
}

type TestcaseComparisonOverview = {
  keysCountCommon: number
  keysCountFresh: number
  keysCountMissing: number
  keysScore: number
  metricsCountCommon: number
  metricsCountFresh: number
  metricsCountMissing: number
  metricsDurationCommonDst: number
  metricsDurationCommonSrc: number
}

type TestcaseComparison = {
  overview: TestcaseComparisonOverview
  body: {
    src: Message['metadata']
    dst: Message['metadata']
    assertions: Cellar
    results: Cellar
    metrics: Cellar
  }
}

function initResultsCellar(
  srcResults: Message['results'],
  dstResults: Message['results'],
  resultType: ResultType
): Cellar {
  const toMap = (m: Message['results']) =>
    new Map(
      m.map((v) => [v.key, { type: v.type, value: v.value, rule: v.rule }])
    )
  const cellar: Cellar = { commonKeys: [], newKeys: [], missingKeys: [] }
  const srcResultsMap = toMap(srcResults)
  const dstResultsMap = toMap(dstResults)
  for (const [key, result] of dstResultsMap) {
    if (result.type != resultType) {
      continue
    }
    if (srcResultsMap.has(key) && srcResultsMap.get(key)?.type === resultType) {
      const cmp = compareTypes(
        srcResultsMap.get(key)!.value,
        dstResultsMap.get(key)!.value,
        srcResultsMap.get(key)!.rule
      )
      cellar.commonKeys.push({ name: key, ...cmp })
      continue
    }
    cellar.missingKeys.push({
      name: key,
      dstValue: Buffer.isBuffer(result.value)
        ? result.value.toString()
        : stringify(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of srcResultsMap) {
    if (result.type != resultType) {
      continue
    }
    if (
      !dstResultsMap.has(key) ||
      dstResultsMap.get(key)?.type !== resultType
    ) {
      cellar.newKeys.push({
        name: key,
        srcValue: Buffer.isBuffer(result.value)
          ? result.value.toString()
          : stringify(result.value),
        srcType: getTypeName(result.value)
      })
    }
  }
  return cellar
}

function initMetricsCellar(
  srcResults: Message['metrics'],
  dstResults: Message['metrics']
) {
  const toMap = (m: Message['metrics']) =>
    new Map(m.map((v) => [v.key, { value: v.value }]))

  const cellar: Cellar = { commonKeys: [], newKeys: [], missingKeys: [] }
  const srcResultsMap = toMap(srcResults)
  const dstResultsMap = toMap(dstResults)
  for (const [key, result] of dstResultsMap) {
    if (srcResultsMap.has(key)) {
      const cmp = compareTypes(
        srcResultsMap.get(key)!.value,
        dstResultsMap.get(key)!.value
      )
      cellar.commonKeys.push({ name: key, ...cmp })
      continue
    }
    cellar.missingKeys.push({
      name: key,
      dstValue: stringify(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of srcResultsMap) {
    if (!dstResultsMap.has(key)) {
      cellar.newKeys.push({
        name: key,
        srcValue: stringify(result.value),
        srcType: getTypeName(result.value)
      })
    }
  }
  return cellar
}

function createTestcaseComparisonOverview(
  assertions: Cellar,
  results: Cellar,
  metrics: Cellar
): TestcaseComparisonOverview {
  const keysCountCommon =
    assertions.commonKeys.length + results.commonKeys.length
  return {
    keysCountCommon,
    keysCountFresh: assertions.newKeys.length + results.newKeys.length,
    keysCountMissing:
      assertions.missingKeys.length + results.missingKeys.length,
    keysScore: keysCountCommon
      ? (assertions.commonKeys.reduce((acc, v) => acc + v.score!, 0) +
          results.commonKeys.reduce((acc, v) => acc + v.score!, 0)) /
        keysCountCommon
      : assertions.missingKeys.length +
        assertions.newKeys.length +
        results.missingKeys.length +
        results.newKeys.length
      ? 0
      : 1,
    metricsCountCommon: metrics.commonKeys.length,
    metricsCountFresh: metrics.newKeys.length,
    metricsCountMissing: metrics.missingKeys.length,
    metricsDurationCommonDst: metrics.commonKeys.reduce(
      (acc, v) => (v.dstValue ? acc + Number(v.dstValue) : acc),
      0
    ),
    metricsDurationCommonSrc: metrics.commonKeys.reduce(
      (acc, v) => (v.srcValue ? acc + Number(v.srcValue) : acc),
      0
    )
  }
}

function compare(srcMessage: Message, dstMessage: Message): TestcaseComparison {
  const assertions = initResultsCellar(
    srcMessage.results,
    dstMessage.results,
    ResultType.Assert
  )
  const results = initResultsCellar(
    srcMessage.results,
    dstMessage.results,
    ResultType.Check
  )
  const metrics = initMetricsCellar(srcMessage.metrics, dstMessage.metrics)
  return {
    overview: createTestcaseComparisonOverview(assertions, results, metrics),
    body: {
      src: srcMessage.metadata,
      dst: dstMessage.metadata,
      assertions,
      results,
      metrics
    }
  }
}

export { TestcaseComparison, compare, stringify }
