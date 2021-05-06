/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
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
    }
  },
  {
    collection: 'meta',
    timestamps: true
  }
)

/**
 *
 */
export interface IMetaDocument extends mongoose.Document {
  cmpAvgCollectionTime: number
  cmpAvgProcessingTime: number
  cmpNumCollectionJobs: number
  cmpNumProcessingJobs: number
}

/**
 *
 */
interface IMetaModel extends mongoose.Model<IMetaDocument> {}

/**
 *
 */
export const MetaModel: IMetaModel = mongoose.model<IMetaDocument, IMetaModel>(
  'Meta',
  metaSchema
)
