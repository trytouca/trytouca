/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
const sessionSchema = new mongoose.Schema({
  agent: {
    required: true,
    type: String
  },
  expiresAt: {
    required: true,
    type: Date
  },
  ipAddr: {
    required: true,
    type: String
  },
  userId: {
    ref: 'User',
    required: true,
    type: mongoose.Schema.Types.ObjectId
  }
})

/**
 *
 */
export interface ISessionDocument extends mongoose.Document {
  agent: string
  expiresAt: Date
  ipAddr: string
  userId: mongoose.Types.ObjectId
}

/**
 *
 */
export interface ISessionModel extends mongoose.Model<ISessionDocument> {}

/**
 *
 */
export const SessionModel: ISessionModel = mongoose.model<
  ISessionDocument,
  ISessionModel
>('Session', sessionSchema)
