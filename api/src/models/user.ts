// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import cuid from 'cuid'

import { SessionModel } from '@/schemas/session'
import { TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { rclient } from '@/utils/redis'
import { tracker } from '@/utils/tracker'

export async function wslFindByRole(role: EPlatformRole): Promise<IUser[]> {
  return await UserModel.find(
    { platformRole: role, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
  )
}

export async function wslFindByUname(uname: string): Promise<IUser> {
  return await UserModel.findOne(
    { username: uname, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
  )
}

/**
 * Provides information about the already registered super user.
 */
export async function wslGetSuperUser(): Promise<IUser> {
  const users = await wslFindByRole(EPlatformRole.Super)
  return users.length === 0 ? null : users[0]
}

export async function userDelete(account: IUser) {
  logger.info('%s: deleting account', account.username)

  // disconnect account from teams
  await TeamModel.updateMany(
    {},
    {
      $pull: {
        admins: account._id,
        applicants: account._id,
        members: account._id,
        invitees: { email: account.email }
      }
    }
  )

  // remove important info from user account
  const newUsername = cuid()
  await UserModel.findByIdAndUpdate(account._id, {
    $set: {
      apiKeys: [],
      email: `noreply+${newUsername}@touca.io`,
      fullname: 'Anonymous User',
      password: 'supersafehash',
      platformRole: EPlatformRole.User,
      prospectiveTeams: [],
      suspended: true,
      teams: [],
      username: newUsername
    },
    $unset: {
      activatedAt: 1,
      activationKey: 1,
      lockedAt: 1,
      loginAttempts: 1,
      resetAt: 1,
      resetKey: 1,
      resetKeyExpiresAt: 1
    }
  })
  logger.info('%s: changed username to %s', account.username, newUsername)

  // remove sessions associated with this user account
  await SessionModel.deleteMany({ userId: account._id })

  // notify platform admins that user deleted their account
  mailer.mailAdmins({
    title: 'Account Deleted',
    body: `User <b>${account.fullname}</b> (<a href="mailto:${account.email}">${account.username}</a>) removed their account.`
  })

  // add event to tracking system
  tracker.track(account, 'account_deleted')

  // remove cache
  rclient.removeCached('platform-stats')
}
