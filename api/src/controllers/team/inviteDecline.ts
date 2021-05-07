/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ITeam, TeamModel } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'
import { NextFunction, Request, Response } from 'express'

/**
 * @summary
 * Removes user from invitation list of the team.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamInvitee`
 *
 * - Database Queries: 1
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

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)
  await rclient.removeCached(`route_teamList_${user.username}`)

  logger.info('%s: declined invitation for team %s', user.username, team.slug)
  return res.status(204).send()
}
