// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ITeam, TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { rclient } from '@/utils/redis'

export async function teamJoinAccept(
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
    $push: { members: account._id },
    $pull: { applicants: account._id }
  })

  // update user document to include team in the list of joined teams

  await UserModel.findByIdAndUpdate(account._id, {
    $push: { teams: team._id },
    $pull: { prospectiveTeams: team._id }
  })

  // remove invalidated cached responses.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)
  await rclient.removeCached(`route_teamList_${account.username}`)

  // send email to user.

  const subject = `Welcome to Team ${team.name}!`
  mailer.mailUser(account, subject, 'team-join-accept', {
    subject,
    adminName: user?.fullname || user?.username,
    teamName: team.name,
    teamLink: [config.webapp.root, '~', team.slug].join('/'),
    userName: account?.fullname || account?.username
  })

  logger.info('%s: accepted %s request to join team %s', ...tuple)
  return res.status(204).send()
}
