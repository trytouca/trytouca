// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

const elementSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String
    },
    note: {
      required: false,
      type: String
    },
    slug: {
      required: true,
      type: String
    },
    suiteId: {
      ref: 'Suite',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    tags: [
      {
        required: false,
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
)

elementSchema.index({ slug: 1, suiteId: 1 })

export interface IElementDocument extends mongoose.Document {
  name: string
  note: string
  slug: string
  suiteId: mongoose.Types.ObjectId
  tags: string[]
}

export interface IElementModel extends mongoose.Model<IElementDocument> {}

export const ElementModel: IElementModel = mongoose.model<
  IElementDocument,
  IElementModel
>('Element', elementSchema)
