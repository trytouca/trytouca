/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

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
    elasticId: {
      required: false,
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

messageSchema.index({ batchId: 1, elementId: 1 })

/**
 *
 */
export interface IMessageDocument extends mongoose.Document {
  batchId: mongoose.Types.ObjectId
  builtAt: Date
  elasticId: string
  elementId: mongoose.Types.ObjectId
  expiresAt: Date
  meta: {
    keysCount: number
    metricsCount: number
    metricsDuration: number
  }
  processedAt: Date
  prunedAt: Date
  submittedAt: Date
  submittedBy: mongoose.Types.ObjectId
}

/**
 *
 */
export interface IMessageModel extends mongoose.Model<IMessageDocument> {
}

/**
 *
 */
export const MessageModel: IMessageModel = mongoose.model<
  IMessageDocument,
  IMessageModel
>('Message', messageSchema)
