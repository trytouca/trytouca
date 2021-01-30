/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
const notificationSchema = new mongoose.Schema({
  createdAt: {
    required: true,
    type: Date
  },
  seenAt: {
    required: false,
    type: Date
  },
  text: {
    required: true,
    type: String
  },
  userId: {
    ref: 'User',
    required: true,
    type: mongoose.Schema.Types.ObjectId
  }
})

notificationSchema.index({ userId: 1, createdAt: -1 })

/**
 *
 */
export interface INotificationDocument extends mongoose.Document {
  createdAt: Date
  seenAt: Date
  text: string
  userId: mongoose.Types.ObjectId
}

/**
 *
 */
export interface INotificationModel
  extends mongoose.Model<INotificationDocument> {}

/**
 *
 */
export const NotificationModel: INotificationModel = mongoose.model<
  INotificationDocument,
  INotificationModel
>('Notification', notificationSchema)
