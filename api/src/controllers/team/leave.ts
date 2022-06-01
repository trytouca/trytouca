// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import {
  findTeamRoleOfUser,
  findTeamUsersByRole
} from '@/controllers/team/common'
import { ITeam, TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import { ETeamRole } from '@/types/commontypes'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { rclient } from '@/utils/redis'

/**
 * @summary
 * Cancel membership and leave a team.
 *
 * @description
 * User making this request is not allowed to perform the following:
 *  - leave if they are owner of the team
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 */
export async function teamLeave(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  logger.debug('%s: leaving team %s', user.username, team.slug)

  // corner case: user cannot leave the team if they own it

  const roleUser = await findTeamRoleOfUser(team, user)
  logger.silly('%s: has role %s in team %s', user.username, roleUser, team.slug)

  if (roleUser === ETeamRole.Owner) {
    return next({
      status: 403,
      errors: ['owner cannot leave their team']
    })
  }

  // now we can proceed with removal

  logger.info('%s: leaving team %s', user.username, team.slug)

  // remove user from team document

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { members: user._id, admins: user._id }
  })

  // remove team from user document

  await UserModel.findByIdAndUpdate(user._id, {
    $pull: { teams: team._id }
  })

  // remove invalidated cached responses.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)
  await rclient.removeCached(`route_teamList_${user.username}`)

  // send email to admins and owner of this team

  const users = await findTeamUsersByRole(team, [
    ETeamRole.Owner,
    ETeamRole.Admin
  ])
  const subject = 'A Member Left Your Team'
  mailer.mailUsers(users, subject, 'team-leave-admin', {
    userName: user.fullname,
    subject,
    teamName: team.name
  })

  logger.info('%s: left team %s', user.username, team.slug)
  return res.status(204).send()
}
