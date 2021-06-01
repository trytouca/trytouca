/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import cuid from 'cuid'
import { NextFunction, Request, Response } from 'express'

import { SessionModel } from '@/schemas/session'
import { TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { tracker } from '@/utils/tracker'

/**
 *
 */
async function accountDeleteImpl(account: IUser) {
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
  await SessionModel.deleteMany({ userId: account._id })
  logger.info('%s: changed username to %s', account.username, newUsername)
}

export async function accountDelete(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.info('%s: attempting to delete account', user.username)

  // reject request if user is owner of the platform

  if (user.platformRole === EPlatformRole.Owner) {
    return next({
      status: 403,
      errors: ['refusing to delete account: platform owner']
    })
  }

  // reject request if user is a member of a team

  if ((await TeamModel.countDocuments({ owner: user._id })) !== 0) {
    return next({
      status: 403,
      errors: ['refusing to delete account: owns team']
    })
  }

  logger.info('%s: deleting account', user.username)

  res.status(202).send()

  // notify platform admins that user deleted their account

  mailer.mailAdmins({
    title: 'Account Deleted',
    body: `User <b>${user.fullname}</b> (<a href="mailto:${user.email}">
      ${user.username}</a>) removed their account.`
  })

  // add event to tracking system

  tracker.track(user, 'account_deleted')

  setTimeout(() => accountDeleteImpl(user), 5000)
}
