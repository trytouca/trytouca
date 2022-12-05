// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ENotificationType } from '@touca/api-schema'
import mongoose from 'mongoose'

import { config } from '../utils/index.js'

type PromotionQueryOutput = {
  at: Date
  by: mongoose.Types.ObjectId
  for: string
  from: mongoose.Types.ObjectId
  to: mongoose.Types.ObjectId
}

type SubscriptionQueryOutput = {
  user: mongoose.Types.ObjectId
  level: ENotificationType
}

const suiteSchema = new mongoose.Schema(
  {
    createdBy: {
      ref: 'User',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    name: {
      required: true,
      type: String
    },
    promotions: [
      {
        _id: false,
        at: {
          required: false,
          type: Date
        },
        by: {
          ref: 'User',
          required: false,
          type: mongoose.Schema.Types.ObjectId
        },
        for: {
          maxlength: 1500,
          minlength: 0,
          type: String
        },
        from: {
          ref: 'Batch',
          required: false,
          type: mongoose.Schema.Types.ObjectId
        },
        to: {
          ref: 'Batch',
          required: false,
          type: mongoose.Schema.Types.ObjectId
        }
      }
    ],
    retainFor: {
      max: 157680000, // 5 years
      min: 86400,
      default: config.services.retention.defaultDuration,
      set: (v: number) => Math.round(v),
      type: Number
    },
    sealAfter: {
      max: 86400,
      min: 60,
      default: config.services.autoseal.defaultDuration,
      set: (v: number) => Math.round(v),
      type: Number
    },
    slug: {
      required: true,
      type: String
    },
    subscribers: [
      {
        ref: 'User',
        required: false,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    subscriptions: [
      {
        _id: false,
        user: {
          ref: 'User',
          required: false,
          type: mongoose.Schema.Types.ObjectId
        },
        level: {
          required: false,
          type: String
        }
      }
    ],
    team: {
      ref: 'Team',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

suiteSchema.index({ team: 1, slug: 1 }, { unique: true })

export interface ISuiteDocument extends mongoose.Document {
  createdBy: mongoose.Types.ObjectId
  name: string
  promotions: PromotionQueryOutput[]
  retainFor: number
  sealAfter: number
  slug: string
  subscribers: mongoose.Types.ObjectId[]
  subscriptions: SubscriptionQueryOutput[]
  team: mongoose.Types.ObjectId
}

export interface ISuiteModel extends mongoose.Model<ISuiteDocument> {}

export const SuiteModel: ISuiteModel = mongoose.model<
  ISuiteDocument,
  ISuiteModel
>('Suite', suiteSchema)
