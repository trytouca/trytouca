/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { format as utilFormat } from 'util'

import { wslFindByRole } from '@/models/user'
import { NotificationModel } from '@/schemas/notification'
import { IUser } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'

/**
 *
 */
async function notifyUser(recipient: IUser, message: string) {
  await NotificationModel.create({
    createdAt: new Date(),
    userId: recipient._id,
    text: message
  })
}

/**
 *
 */
async function notifyUsers(users: IUser[], message: string) {
  const jobs = users.map((user) => notifyUser(user, message))
  const results = await Promise.all(jobs)
  return results.every(Boolean)
}

/**
 *
 */
export async function notifyPlatformAdmins(fmtstr: string, ...args) {
  const message = utilFormat(fmtstr, ...args)
  const platformAdmins = await wslFindByRole(EPlatformRole.Admin)
  const platformOwner = await wslFindByRole(EPlatformRole.Owner)
  const users = [...platformAdmins, ...platformOwner]
  return notifyUsers(users, message)
}
