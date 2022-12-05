// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

export enum EReportType {
  Seal = 'seal',
  Promote = 'promote'
}

const reportSchema = new mongoose.Schema(
  {
    dstBatchId: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    reportedAt: {
      required: false,
      type: Date
    },
    srcBatchId: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    reportType: {
      enum: Object.values(EReportType),
      required: true,
      type: String
    }
  },
  {
    timestamps: true
  }
)

reportSchema.index({ srcBatchId: 1, dstBatchId: 1 })

export interface IReportDocument extends mongoose.Document {
  dstBatchId: mongoose.Types.ObjectId
  reportedAt: Date
  reportType: EReportType
  srcBatchId: mongoose.Types.ObjectId
}

interface IReportModel extends mongoose.Model<IReportDocument> {}

export const ReportModel: IReportModel = mongoose.model<
  IReportDocument,
  IReportModel
>('Report', reportSchema)
