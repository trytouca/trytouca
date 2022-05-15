// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

const nodeSchema = new mongoose.Schema(
  {
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
    },
    uuid: {
      required: true,
      type: String,
      unique: true
    }
  },
  {
    collection: 'node',
    timestamps: true
  }
)

export interface INodeDocument extends mongoose.Document {
  company: string
  email: string
  name: string
  uuid: string
}

interface INodeModel extends mongoose.Model<INodeDocument> {}

export const NodeModel: INodeModel = mongoose.model<INodeDocument, INodeModel>(
  'Node',
  nodeSchema
)
