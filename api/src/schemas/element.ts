/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
const elementSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String
    },
    suiteId: {
      ref: 'Suite',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    }
  },
  {
    timestamps: true
  }
)

elementSchema.index({ name: 1, suiteId: 1 })

/**
 *
 */
export interface IElementDocument extends mongoose.Document {
  name: string
  suiteId: mongoose.Types.ObjectId
}

/**
 *
 */
export interface IElementModel extends mongoose.Model<IElementDocument> {}

/**
 *
 */
export const ElementModel: IElementModel = mongoose.model<
  IElementDocument,
  IElementModel
>('Element', elementSchema)
