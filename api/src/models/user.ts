// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import cuid from 'cuid'

import { IUser, SessionModel, TeamModel, UserModel } from '../schemas/index.js'
import { analytics, logger, mailAdmins, redisClient } from '../utils/index.js'

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
  const users = await wslFindByRole('super')
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
  const userRole: EPlatformRole = 'user'
  await UserModel.findByIdAndUpdate(account._id, {
    $set: {
      apiKeys: [],
      email: `noreply+${newUsername}@touca.io`,
      fullname: 'Anonymous User',
      password: 'supersafehash',
      platformRole: userRole,
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
  mailAdmins({
    title: 'Account Deleted',
    body: `User <b>${account.fullname}</b> (<a href="mailto:${account.email}">${account.username}</a>) removed their account.`
  })

  analytics.add_activity('account:deleted', account)
  redisClient.removeCached('platform-stats')
}
