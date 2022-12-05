// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ITeam, IUser, TeamModel } from '../../schemas/index.js'
import { analytics, EActivity, logger, redisClient } from '../../utils/index.js'

/**
 * @summary
 * Removes user from invitation list of the team.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamInvitee`
 */
export async function teamInviteDecline(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  logger.debug('%s: declining invitation for team %s', user.username, team.slug)

  // remove user from list of invitees

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { invitees: { email: user.email } }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)
  await redisClient.removeCached(`route_teamList_${user.username}`)

  analytics.add_activity(EActivity.TeamMemberDeclined, user._id, {
    team_id: team._id
  })

  logger.info('%s: declined invitation for team %s', user.username, team.slug)
  return res.status(204).send()
}
