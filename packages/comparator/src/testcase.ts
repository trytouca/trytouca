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
  const cellar: Cellar = { commonKeys: [], newKeys: [], missingKeys: [] }
  for (const [key, result] of Object.entries(dstResults)) {
    if (result.type != resultType) {
      continue
    }
    if (key in srcResults) {
      const cmp = compareTypes(srcResults[key]!.value, dstResults[key]!.value)
      cellar.commonKeys.push({ name: key, ...cmp })
      continue
    }
    cellar.missingKeys.push({
      name: key,
      dstValue: stringifyValue(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of Object.entries(srcResults)) {
    if (result.type != ResultType.Check) {
      continue
    }
    if (!(key in dstResults)) {
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
  const cellar: Cellar = { commonKeys: [], newKeys: [], missingKeys: [] }
  for (const [key, result] of Object.entries(dstResults)) {
    if (key in srcResults) {
      const cmp = compareTypes(srcResults[key]!.value, dstResults[key]!.value)
      cellar.commonKeys.push({ name: key, ...cmp })
      continue
    }
    cellar.missingKeys.push({
      name: key,
      dstValue: stringifyValue(result.value),
      dstType: getTypeName(result.value)
    })
  }
  for (const [key, result] of Object.entries(srcResults)) {
    if (!(key in dstResults)) {
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
  return {
    overview: {
      keysCountCommon: 0,
      keysCountFresh: 0,
      keysCountMissing: 0,
      keysScore: 0,
      metricsCountCommon: 0,
      metricsCountFresh: 0,
      metricsCountMissing: 0,
      metricsDurationCommonDst: 0,
      metricsDurationCommonSrc: 0
    },
    body: {
      src: srcMessage.metadata,
      dst: dstMessage.metadata,
      assertions: initResultsCellar(
        srcMessage.results,
        dstMessage.results,
        ResultType.Assert
      ),
      results: initResultsCellar(
        srcMessage.results,
        dstMessage.results,
        ResultType.Check
      ),
      metrics: initMetricsCellar(srcMessage.metrics, dstMessage.metrics)
    }
  }
}

export { TestcaseComparison, compare }
