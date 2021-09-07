// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

/**
 *
 */
const messageSchema = new mongoose.Schema(
  {
    batchId: {
      ref: 'Batch',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    builtAt: {
      required: true,
      type: Date
    },
    contentId: {
      required: false,
      unique: true,
      type: String
    },
    elementId: {
      ref: 'Element',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    expiresAt: {
      required: true,
      type: Date
    },
    meta: {
      required: false,
      type: {
        keysCount: {
          required: false,
          type: Number
        },
        metricsCount: {
          required: false,
          type: Number
        },
        metricsDuration: {
          required: false,
          type: Number
        }
      }
    },
    processedAt: {
      required: false,
      type: Date
    },
    prunedAt: {
      required: false,
      type: Date
    },
    reservedAt: {
      required: false,
      type: Date
    },
    submittedAt: {
      required: true,
      type: Date
    },
    submittedBy: {
      ref: 'User',
      required: false,
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

/**
 *
 */
messageSchema.index({ batchId: 1, elementId: 1 })

/**
 *
 */
export interface IMessageDocument extends mongoose.Document {
  batchId: mongoose.Types.ObjectId
  builtAt: Date
  contentId: string
  elementId: mongoose.Types.ObjectId
  expiresAt: Date
  meta: {
    keysCount: number
    metricsCount: number
    metricsDuration: number
  }
  processedAt: Date
  prunedAt: Date
  reservedAt: Date
  submittedAt: Date
  submittedBy: mongoose.Types.ObjectId
}

/**
 *
 */
export interface IMessageModel extends mongoose.Model<IMessageDocument> {}

/**
 *
 */
export const MessageModel: IMessageModel = mongoose.model<
  IMessageDocument,
  IMessageModel
>('Message', messageSchema)
