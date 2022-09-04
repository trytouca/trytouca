import { Message } from "@touca/flatbuffers";

type Cellar = {
  commonKeys: Array<Record<string, unknown>>;
  missingKeys: Array<Record<string, unknown>>;
  newKeys: Array<Record<string, unknown>>;
};

type TestcaseComparisonOverview = {
  keysCountCommon: number;
  keysCountFresh: number;
  keysCountMissing: number;
  keysScore: number;
  metricsCountCommon: number;
  metricsCountFresh: number;
  metricsCountMissing: number;
  metricsDurationCommonDst: number;
  metricsDurationCommonSrc: number;
};

type TestcaseComparison = {
  overview: TestcaseComparisonOverview;
  body: {
    src: Message["metadata"];
    dst: Message["metadata"];
    assertions: Cellar;
    results: Cellar;
    metrics: Cellar;
  };
};

function compare(_src: Message, _dst: Message): TestcaseComparison {
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
      metricsDurationCommonSrc: 0,
    },
    body: {
      src: {
        teamslug: "teamslug",
        testsuite: "testsuite",
        version: "version",
        testcase: "testcase",
        builtAt: "builtAt",
      },
      dst: {
        teamslug: "teamslug",
        testsuite: "testsuite",
        version: "version",
        testcase: "testcase",
        builtAt: "builtAt",
      },
      assertions: {
        commonKeys: [],
        missingKeys: [],
        newKeys: [],
      },
      results: {
        commonKeys: [],
        missingKeys: [],
        newKeys: [],
      },
      metrics: {
        commonKeys: [],
        missingKeys: [],
        newKeys: [],
      },
    },
  };
}

export { TestcaseComparison, compare };
