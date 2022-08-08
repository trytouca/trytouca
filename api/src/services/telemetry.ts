// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { relay } from '@/models/relay'
import { BatchModel } from '@/schemas/batch'
import { MessageModel } from '@/schemas/message'
import { IMetaDocument, MetaModel } from '@/schemas/meta'
import { ReportModel } from '@/schemas/report'
import { SessionModel } from '@/schemas/session'
import { config } from '@/utils/config'
import logger from '@/utils/logger'

type TelemetryPayload = {
  created_at: Date
  messages_new: number
  node_id: string
  reports_new: number
  runtime_new: number
  sessions_new: number
  users_active: number
  versions_new: number
}

function lastReportedAt() {
  const date = new Date()
  date.setSeconds(date.getSeconds() - config.services.telemetry.defaultDuration)
  return date
}

async function reportTelemetry(meta: IMetaDocument) {
  const serviceName = 'service telemetry'
  logger.info('%s: collecting aggregate usage data', serviceName)
  const filter = {
    createdAt: { $gt: meta.telemetryReportedAt ?? lastReportedAt() }
  }
  const sessionsCount = await SessionModel.aggregate([
    { $match: filter },
    { $project: { userId: 1 } },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 }
      }
    }
  ])
  const batchesCount = await BatchModel.aggregate([
    { $match: filter },
    { $project: { _id: 1, runtime: '$meta.metricsDurationHead' } }
  ])
  const report: TelemetryPayload = {
    created_at: new Date(),
    messages_new: await MessageModel.countDocuments(filter),
    node_id: meta.uuid,
    reports_new: await ReportModel.countDocuments(filter),
    runtime_new: batchesCount.reduce(
      (acc, v) => acc + (v.runtime ?? 0) / 1000,
      0
    ),
    sessions_new: sessionsCount.reduce((acc, v) => acc + v.count, 0),
    users_active: sessionsCount.length,
    versions_new: batchesCount.length
  }
  await relay({
    path: '/feedback',
    data: JSON.stringify({
      body: JSON.stringify(report),
      cname: meta.contact.company,
      email: meta.contact.email,
      name: meta.contact.name,
      page: 'usage-data'
    })
  })
  logger.info('%s: reported aggregate usage data', serviceName)
}

export async function telemetryService(): Promise<void> {
  logger.silly('telemetry service: running')
  const meta = await MetaModel.findOne(
    {
      telemetry: true,
      $or: [
        { telemetryReportedAt: { $exists: false } },
        { telemetryReportedAt: { $lt: lastReportedAt() } }
      ]
    },
    { _id: 0, contact: 1, telemetryReportedAt: 1, uuid: 1 }
  )
  if (!meta) {
    return
  }
  await reportTelemetry(meta)
  await MetaModel.updateOne({}, { $set: { telemetryReportedAt: new Date() } })
}
