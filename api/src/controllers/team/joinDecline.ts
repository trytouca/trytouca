/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '@weasel/schemas/user'
import { ITeam, TeamModel } from '@weasel/schemas/team'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'
import { rclient } from '@weasel/utils/redis'

/**
 *
 */
export async function teamJoinDecline(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [user.username, account.username, team.slug]
  logger.debug('%s: joining team %s', user.username, team.slug)

  // reject request if user is already a member

  const isMember = await UserModel.countDocuments({
    _id: account._id,
    teams: { $in: [team._id] }
  })
  if (isMember) {
    return next({
      errors: ['user already a member'],
      status: 409
    })
  }

  // reject request if user has no pending join request

  const hasPending = await TeamModel.countDocuments({
    _id: team._id,
    applicants: { $in: account._id }
  })
  if (!hasPending) {
    return next({
      errors: ['user has no pending join request'],
      status: 409
    })
  }

  // update team document to include user in the list of members

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { applicants: account._id }
  })

  // update user document to remove team from the list of prospective teams

  await UserModel.findByIdAndUpdate(account._id, {
    $pull: { prospectiveTeams: team._id }
  })

  // remove invalidated cached responses.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)
  await rclient.removeCached(`route_teamList_${account.username}`)

  // send email to user.

  const subject = `Your request to join team ${team.name} was declined`
  mailer.mailUser(account, subject, 'team-join-decline', {
    subject,
    teamName: team.name,
    teamLink: [config.webapp.root, '~', team.slug].join('/'),
    userName: account?.fullname || account?.username
  })

  logger.info('%s: declined %s request to join team %s', ...tuple)
  return res.status(204).send()
}
