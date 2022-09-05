import { Message, ResultType } from '@touca/flatbuffers'
import {
  getTypeName,
  stringifyValue,
  CppTypeComparison,
  compare as compareTypes
} from './type'

type Cell = { name: string } & Partial<CppTypeComparison>

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
    new Map(m.map((v) => [v.name, { type: v.type, value: v.value }]))

  const cellar: Cellar = { commonKeys: [], newKeys: [], missingKeys: [] }
  const srcResultsMap = toMap(srcResults)
  const dstResultsMap = toMap(dstResults)
  for (const [key, result] of dstResultsMap) {
    if (result.type != resultType) {
      continue
    }
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
      dstValue: stringifyValue(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of srcResultsMap) {
    if (result.type != ResultType.Check) {
      continue
    }
    if (!dstResultsMap.has(key)) {
      cellar.newKeys.push({
        name: key,
        srcValue: stringifyValue(result.value),
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
    new Map(m.map((v) => [v.name, { value: v.value }]))

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
      dstValue: stringifyValue(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of srcResultsMap) {
    if (!dstResultsMap.has(key)) {
      cellar.newKeys.push({
        name: key,
        srcValue: stringifyValue(result.value),
        srcType: getTypeName(result.value)
      })
    }
  }
  return cellar
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
    overview: {
      keysCountCommon: assertions.commonKeys.length + results.commonKeys.length,
      keysCountFresh: assertions.newKeys.length + results.newKeys.length,
      keysCountMissing:
        assertions.missingKeys.length + results.missingKeys.length,
      keysScore:
        assertions.commonKeys.reduce((acc, v) => acc + v.score!, 0) +
        results.commonKeys.reduce((acc, v) => acc + v.score!, 0),
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
    },
    body: {
      src: srcMessage.metadata,
      dst: dstMessage.metadata,
      assertions,
      results,
      metrics
    }
  }
}

export { TestcaseComparison, compare, stringifyValue }
