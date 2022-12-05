// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { format } from 'util'

import { wslFindByRole } from '../models/index.js'
import { IUser, NotificationModel } from '../schemas/index.js'

async function notifyUser(recipient: IUser, message: string) {
  await NotificationModel.create({
    createdAt: new Date(),
    userId: recipient._id,
    text: message
  })
}

async function notifyUsers(users: IUser[], message: string) {
  const jobs = users.map((user) => notifyUser(user, message))
  const results = await Promise.all(jobs)
  return results.every(Boolean)
}

export async function notifyPlatformAdmins(fmtstr: string, ...args) {
  const message = format(fmtstr, ...args)
  const platformAdmins = await wslFindByRole('admin')
  const platformOwner = await wslFindByRole('owner')
  const users = [...platformAdmins, ...platformOwner]
  return notifyUsers(users, message)
}
