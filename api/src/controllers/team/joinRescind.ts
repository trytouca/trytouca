// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ITeam, TeamModel } from '../../schemas/team.js'
import { IUser, UserModel } from '../../schemas/user.js'
import logger from '../../utils/logger.js'
import { redisClient } from '../../utils/redis.js'
import { analytics, EActivity } from '../../utils/tracker.js'

export async function teamJoinRescind(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [user.username, team.slug]
  logger.debug('%s: rescinding request to join %s', ...tuple)

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

  // reject the request if user has no pending join request

  const hasPending = await TeamModel.countDocuments({
    _id: team._id,
    applicants: { $in: user._id }
  })
  if (!hasPending) {
    return next({
      errors: ['user has no pending join request'],
      status: 409
    })
  }

  // remove user from list of users with pending join requests

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { applicants: user._id }
  })

  // update user document to remove team from the list of prospective teams

  await UserModel.findByIdAndUpdate(user._id, {
    $pull: { prospectiveTeams: team._id }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)
  await redisClient.removeCached(`route_teamList_${user.username}`)

  // we choose not to send an email for this event.

  analytics.add_activity(EActivity.TeamMemberWithdrawn, user._id, {
    team_id: team._id
  })

  logger.info('%s: request to join team %s rescinded', ...tuple)
  return res.status(204).send()
}
