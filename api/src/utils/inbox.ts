/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { format as utilFormat } from 'util'
import { EPlatformRole } from '../commontypes'
import { NotificationModel } from '../schemas/notification'
import { IUser, UserModel } from '../schemas/user'

/**
 *
 */
async function notifyUser(recipient: IUser, message: string) {
  const doc = new NotificationModel({
    createdAt: new Date(),
    userId: recipient._id,
    text: message
  })
  await doc.save()
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
  const platformAdmins = await UserModel.wslFindByRole(EPlatformRole.Admin)
  const platformOwner = await UserModel.wslFindByRole(EPlatformRole.Owner)
  const users = [ ...platformAdmins, ...platformOwner ]
  return notifyUsers(users, message)
}
