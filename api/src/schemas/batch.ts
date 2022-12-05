// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

const batchSchema = new mongoose.Schema(
  {
    elements: [
      {
        ref: 'Element',
        required: false,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    expirable: {
      default: true,
      required: true,
      type: Boolean
    },
    meta: {
      required: false,
      type: {
        elementsCountDifferent: { required: false, type: Number },
        elementsCountFresh: { required: false, type: Number },
        elementsCountHead: { required: false, type: Number },
        elementsCountMissing: { required: false, type: Number },
        elementsCountPending: { required: false, type: Number },
        elementsScoreAbsolute: { required: false, type: Number },
        elementsScoreAggregate: { required: false, type: Number },
        metricsDurationChange: { required: false, type: Number },
        metricsDurationHead: { required: false, type: Number },
        metricsDurationSign: { required: false, type: Number }
      }
    },
    sealedAt: {
      required: false,
      type: Date
    },
    slug: {
      required: true,
      type: String
    },
    submittedAt: {
      required: false,
      type: Date
    },
    submittedBy: [
      {
        ref: 'User',
        required: false,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    suite: {
      ref: 'Suite',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    superior: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

batchSchema.index({ slug: 1, suite: 1 }, { unique: true })

export interface IBatchDocument extends mongoose.Document {
  elements: mongoose.Types.ObjectId[]
  expirable: boolean
  meta: {
    elementsCountDifferent: number
    elementsCountFresh: number
    elementsCountHead: number
    elementsCountMissing: number
    elementsCountPending: number
    elementsScoreAbsolute: number
    elementsScoreAggregate: number
    metricsDurationChange: number
    metricsDurationHead: number
    metricsDurationSign: number
  }
  sealedAt: Date
  slug: string
  submittedAt: Date
  submittedBy: mongoose.Types.ObjectId[]
  suite: mongoose.Types.ObjectId
  updatedAt: Date
  superior: mongoose.Types.ObjectId
}

export interface IBatchModel extends mongoose.Model<IBatchDocument> {}

export const BatchModel: IBatchModel = mongoose.model<
  IBatchDocument,
  IBatchModel
>('Batch', batchSchema)
