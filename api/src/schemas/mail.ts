// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

export interface IMail {
  recipient: string
  sender: string
  subject: string
}

const mailSchema = new mongoose.Schema(
  {
    recipient: {
      required: true,
      type: String
    },
    sender: {
      required: true,
      type: String
    },
    subject: {
      required: true,
      type: String
    }
  },
  {
    timestamps: true
  }
)

export interface IMailDocument extends mongoose.Document {
  recipient: string
  sender: string
  subject: string
}

export interface IMailModel extends mongoose.Model<IMailDocument> {}

export const MailModel: IMailModel = mongoose.model<IMailDocument, IMailModel>(
  'Mail',
  mailSchema
)
