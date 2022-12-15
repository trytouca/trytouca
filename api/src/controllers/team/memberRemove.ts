// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { findTeamRoleOfUser } from '../../models/index.js'
import { ITeam, IUser, TeamModel, UserModel } from '../../schemas/index.js'
import { analytics, logger, mailUser, redisClient } from '../../utils/index.js'

/**
 * @summary
 * Remove a team member from the team.
 *
 * @description
 * User making this request is not allowed to perform the following:
 *  - remove themselves
 *  - remove a member of a same team role
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamAdmin`
 *  - `hasMember` to yield `member`
 */
export async function teamMemberRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const member = res.locals.member as IUser
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [user.username, member.username, team.slug]
  logger.debug('%s: removing member %s from team %s', ...tuple)

  // corner case: no one allowed to remove themselves

  if (member.username === user.username) {
    return next({
      status: 403,
      errors: ['removing own membership forbidden']
    })
  }

  // find role of this user in this team

  const roleUser = await findTeamRoleOfUser(team, user)
  logger.silly('%s: has role %s in team %s', user.username, roleUser, team.slug)

  // find role of member in this team

  const roleMember = await findTeamRoleOfUser(team, member)
  logger.silly(
    '%s: has role %s in team %s',
    member.username,
    roleMember,
    team.slug
  )

  // define a helper function to determine seniority of roles

  const orders: ETeamRole[] = ['member', 'admin', 'owner']
  const getOrder = (role: ETeamRole) => orders.findIndex((v) => v === role)

  // disallow admins to remove members with a role higher or equal their own

  if (getOrder(roleUser) <= getOrder(roleMember)) {
    return next({
      status: 403,
      errors: ['removing senior members forbidden']
    })
  }

  // now we can proceed with removal

  logger.info('%s: removing member %s from team %s', ...tuple)

  // remove user from team document

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { members: member._id, admins: member._id }
  })

  // remove team from user document

  await UserModel.findByIdAndUpdate(member._id, {
    $pull: { teams: team._id }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)

  // send email to user

  const subject = `You were removed from team ${team.name}`
  mailUser(member, subject, 'team-member-remove', {
    adminEmail: user.email,
    adminName: user.fullname,
    subject,
    teamName: team.name,
    userName: member.fullname || member.username
  })

  analytics.add_activity('team_member:removed', user._id, {
    member_id: member._id,
    team_id: team._id
  })

  logger.info('%s: removed member %s from team %s', ...tuple)
  return res.status(204).send()
}
