// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { findTeamUsersByRole } from '../../controllers/team/common.js'
import { ITeam, IUser, TeamModel, UserModel } from '../../schemas/index.js'
import {
  analytics,
  config,
  EActivity,
  logger,
  mailUsers,
  redisClient
} from '../../utils/index.js'

export async function teamJoinAdd(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [user.username, team.slug]
  logger.debug('%s: requesting to join %s', ...tuple)

  // reject the request if user is a member of this team

  const isMember = await UserModel.countDocuments({
    _id: user._id,
    teams: { $in: [team._id] }
  })
  if (isMember) {
    return next({
      errors: ['user already a member'],
      status: 409
    })
  }

  // reject the request if user has a pending join request

  const hasPending = await TeamModel.countDocuments({
    _id: team._id,
    applicants: { $in: user._id }
  })
  if (hasPending) {
    return next({
      errors: ['user has pending join request'],
      status: 409
    })
  }

  // add user to the list of users with pending join requests

  await TeamModel.findByIdAndUpdate(team._id, {
    $push: { applicants: user._id }
  })

  // update user document to include team in the list of prospective teams

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { prospectiveTeams: team._id }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)
  await redisClient.removeCached(`route_teamList_${user.username}`)

  // send email to team admins.

  const subject = `${user.fullname} asks to join team ${team.name}`
  const users = await findTeamUsersByRole(team, ['owner', 'admin'])
  mailUsers(users, subject, 'team-join-add', {
    subject,
    teamName: team.name,
    teamLink: [config.webapp.root, '~', team.slug].join('/') + '?t=members',
    userName: user?.fullname || user?.username
  })

  analytics.add_activity(EActivity.TeamMemberRequested, user._id, {
    team_id: team._id
  })

  logger.info('%s: request to join team %s submitted', ...tuple)
  return res.status(204).send()
}
