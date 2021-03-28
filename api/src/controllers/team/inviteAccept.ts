/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '@weasel/schemas/user'
import { ITeam, TeamModel } from '@weasel/schemas/team'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'

/**
 * @summary
 * Adds user to the given team they were invited to.
 *
 * @description
 * Removes user from invitation list of the team and adds them to the list
 * of members.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamInvitee`
 *
 * - Database Queries: 2
 */
export async function teamInviteAccept(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  logger.debug('%s: joining team %s', user.username, team.slug)

  // update team document to include user in the list of members

  await TeamModel.findByIdAndUpdate(team._id, {
    $push: { members: user._id },
    $pull: { invitees: { email: user.email } }
  })

  // update user document to include team in the list of joined teams

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { teams: team._id }
  })

  // remove invalidated cached responses.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)
  await rclient.removeCached(`route_teamList_${user.username}`)

  logger.info('%s: joined team %s', user.username, team.slug)
  return res.status(204).send()
}
