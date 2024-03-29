// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { compare } from '@touca/comparator'
import { deserialize } from '@touca/flatbuffers'

import { ComparisonJob, comparisonProcess } from '../models/index.js'
import { objectStore } from '../utils/index.js'
import { JobQueue, PerformanceMarks } from './common.js'

async function processor(job: ComparisonJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  const srcBuffer = await objectStore.getMessage(job.srcMessageId.toString())
  const dstBuffer = await objectStore.getMessage(job.dstMessageId.toString())
  perf.mark('object_store:fetch')
  const srcMessage = deserialize(srcBuffer)
  const dstMessage = deserialize(dstBuffer)
  perf.mark('flatbuffers:deserialize')
  const output = compare(srcMessage, dstMessage)
  perf.mark('comparator:compare')
  const { error } = await comparisonProcess(job.jobId.toString(), output)
  perf.mark('comparison:process')
  return error ? Promise.reject(error) : perf
}

export const comparisonQueue = new JobQueue('comparisons', processor)
