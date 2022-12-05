// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { stringify } from '@touca/comparator'
import { deserialize, Message } from '@touca/flatbuffers'

import { MessageJob } from '../models/comparison.js'
import { messageProcess } from '../models/message.js'
import { MessageOverview, MessageTransformed } from '../types/backendtypes.js'
import { JobQueue, objectStore, PerformanceMarks } from '../utils/index.js'

function buildMessageOverview(message: Message): MessageOverview {
  return {
    keysCount: message.results.length,
    metricsCount: message.metrics.length,
    metricsDuration: message.metrics.reduce(
      (sum, v) => sum + Number(v.value),
      0
    )
  }
}

function transform(message: Message): MessageTransformed {
  return {
    metadata: message.metadata,
    metrics: message.metrics.map((v) => ({
      key: v.key,
      value: stringify(v.value)
    })),
    results: message.results.map((v) => ({
      key: v.key,
      value: stringify(v.value)
    }))
  }
}

async function processor(job: MessageJob): Promise<PerformanceMarks> {
  const perf = new PerformanceMarks()
  const buffer = await objectStore.getMessage(job.messageId.toString())
  perf.mark('object_store:fetch')
  const message = deserialize(buffer)
  perf.mark('flatbuffers:deserialize')
  const { error } = await messageProcess(job.messageId.toString(), {
    overview: buildMessageOverview(message),
    body: transform(message)
  })
  perf.mark('message:process')
  return error ? Promise.reject(error) : perf
}

export const messageQueue = new JobQueue('messages', processor)
