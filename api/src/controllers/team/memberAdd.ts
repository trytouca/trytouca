// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { ITeam, IUser, TeamModel, UserModel } from '../../schemas/index.js'
import {
  analytics,
  EActivity,
  logger,
  mailUser,
  redisClient
} from '../../utils/index.js'

/**
 * @summary
 * Adds a user already registered on the platform to an existing team.
 *
 * @description
 * This operation is reserved for the platform administrator and should
 * be used only in case of emergency. The preferred workflow is always
 * to invite the user and ask them to accept the invitation.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `isPlatformAdmin`
 *  - `hasTeam` to yield `team`
 *  - `hasAccount` to yield `account`
 */
export async function teamMemberAdd(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const account = res.locals.account as IUser
  const tuple = [user.username, account.username, team.slug]
  logger.debug('%s: adding %s to team %s', ...tuple)

  // reject the request if user is already a member of this team

  const isMember = await UserModel.countDocuments({
    username: account.username,
    teams: { $in: [team._id] }
  })
  if (isMember) {
    return next({
      errors: ['user already a member'],
      status: 409
    })
  }

  // update team document to include user in the list of members

  await TeamModel.findByIdAndUpdate(team._id, {
    $push: { members: account._id },
    $pull: {
      invitees: { email: account.email },
      applicants: account._id
    }
  })

  // update user document to include team in the list of joined teams

  await UserModel.findByIdAndUpdate(account._id, {
    $push: { teams: team._id }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)

  // send email to user

  const subject = `Welcome to team "${team.name}"`
  mailUser(account, subject, 'team-member-add', {
    ownerName: user.fullname,
    ownerEmail: user.email,
    subject,
    teamName: team.name,
    userName: account?.fullname || account?.username
  })

  analytics.add_activity(EActivity.TeamMemberAdded, user._id, {
    member_id: account._id,
    team_id: team._id
  })

  logger.info('%s: added %s to team %s', ...tuple)
  return res.status(204).send()
}
