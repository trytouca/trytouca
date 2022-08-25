export type Cellar = {
  commonKeys: Record<string, unknown>[]
  missingKeys: Record<string, unknown>[]
  newKeys: Record<string, unknown>[]
}
export type MessageProcessInput = {
  overview: {
    keysCount: number
    metricsCount: number
    metricsDuration: number
  }
  body: Record<string, unknown>
}
export type TestcaseComparisonOverview = {
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
export type TestcaseMetadata = {
  teamslug: string
  testsuite: string
  version: string
  testcase: string
  builtAt: string
}
export type ComparisonProcessInput = {
  overview: TestcaseComparisonOverview
  body: {
    src: TestcaseMetadata
    dst: TestcaseMetadata
    assertions: Cellar
    results: Cellar
    metrics: Cellar
  }
}

export async function parseMessage(
  message: unknown
): Promise<MessageProcessInput> {
  return {
    overview: {
      keysCount: 0,
      metricsCount: 0,
      metricsDuration: 0
    },
    body: {}
  }
}

export async function parseComparison(
  src: Buffer,
  dst: Buffer
): Promise<ComparisonProcessInput> {
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
      src: {
        teamslug: 'teamslug',
        testsuite: 'testsuite',
        version: 'version',
        testcase: 'testcase',
        builtAt: 'builtAt'
      },
      dst: {
        teamslug: 'teamslug',
        testsuite: 'testsuite',
        version: 'version',
        testcase: 'testcase',
        builtAt: 'builtAt'
      },
      assertions: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      },
      results: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      },
      metrics: {
        commonKeys: [],
        missingKeys: [],
        newKeys: []
      }
    }
  }
}
