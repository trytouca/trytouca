// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

const metaSchema = new mongoose.Schema(
  {
    cmpAvgCollectionTime: {
      default: 0,
      required: false,
      type: Number
    },
    cmpAvgProcessingTime: {
      default: 0,
      required: false,
      type: Number
    },
    cmpNumCollectionJobs: {
      default: 0,
      required: false,
      type: Number
    },
    cmpNumProcessingJobs: {
      default: 0,
      required: false,
      type: Number
    },
    telemetry: {
      required: false,
      type: Boolean
    }
  },
  {
    collection: 'meta',
    timestamps: true
  }
)

export interface IMetaDocument extends mongoose.Document {
  cmpAvgCollectionTime: number
  cmpAvgProcessingTime: number
  cmpNumCollectionJobs: number
  cmpNumProcessingJobs: number
  telemetry: boolean
}

interface IMetaModel extends mongoose.Model<IMetaDocument> {}

export const MetaModel: IMetaModel = mongoose.model<IMetaDocument, IMetaModel>(
  'Meta',
  metaSchema
)
