// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

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
    contact: {
      _id: false,
      required: false,
      type: {
        company: {
          required: false,
          type: String
        },
        email: {
          required: true,
          type: String
        },
        name: {
          required: true,
          type: String
        }
      }
    },
    mail: {
      _id: false,
      required: false,
      type: {
        host: {
          required: false,
          type: String
        },
        pass: {
          required: false,
          type: String
        },
        port: {
          required: false,
          type: Number
        },
        user: {
          required: false,
          type: String
        }
      }
    },
    telemetry: {
      default: true,
      required: false,
      type: Boolean
    },
    telemetryReportedAt: {
      required: false,
      type: Date
    },
    uuid: {
      default: () => uuidv4(),
      type: String
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
  contact: {
    company: string
    email: string
    name: string
  }
  mail: {
    host: string
    pass: string
    port: number
    user: string
  }
  telemetry: boolean
  telemetryReportedAt: Date
  uuid: string
}

interface IMetaModel extends mongoose.Model<IMetaDocument> {}

export const MetaModel: IMetaModel = mongoose.model<IMetaDocument, IMetaModel>(
  'Meta',
  metaSchema
)
