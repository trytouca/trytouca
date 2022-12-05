// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ITeam, TeamModel } from '../../schemas/team.js'
import { IUser, UserModel } from '../../schemas/user.js'
import { config } from '../../utils/config.js'
import logger from '../../utils/logger.js'
import * as mailer from '../../utils/mailer.js'
import { redisClient } from '../../utils/redis.js'
import { analytics, EActivity } from '../../utils/tracker.js'

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

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)
  await redisClient.removeCached(`route_teamList_${account.username}`)

  // send email to user.

  const subject = `Your request to join team ${team.name} was rejected`
  mailer.mailUser(account, subject, 'team-join-decline', {
    subject,
    teamName: team.name,
    teamLink: [config.webapp.root, '~', team.slug].join('/'),
    userName: account?.fullname || account?.username
  })

  analytics.add_activity(EActivity.TeamMemberRejected, user._id, {
    team_id: team._id,
    member_id: account._id
  })

  logger.info('%s: rejected %s request to join team %s', ...tuple)
  return res.status(204).send()
}
