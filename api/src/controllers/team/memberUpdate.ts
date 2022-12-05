// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { findTeamRoleOfUser } from '../../controllers/team/common.js'
import { ITeam, IUser, TeamModel } from '../../schemas/index.js'
import { analytics, EActivity, logger, redisClient } from '../../utils/index.js'

/**
 * @summary
 * Updates role of a team member within that team.
 *
 * @description
 * User making this request is not allowed to perform the following:
 *  - update their own role
 *  - update a member to the role of team owner
 *  - update members with a role higher than their own
 *  - update a member to a role higher than their own
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamAdmin`
 *  - `hasMember` to yield `member`
 */
export async function teamMemberUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const member = res.locals.member as IUser
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const roleNew = req.body.role as ETeamRole
  logger.info(
    '%s: %s: updating role of member %s to %s',
    user.username,
    team.slug,
    member.username,
    roleNew
  )

  // corner case: no one allowed to be promoted to team owner (already covered)
  // corner case: no one allowed to promote or demote themselves

  if (member.username === user.username) {
    return next({
      status: 403,
      errors: ['updating own role forbidden']
    })
  }

  // find role of this user in this team

  const roleUser = await findTeamRoleOfUser(team, user)
  logger.silly('%s: has role %s in team %s', user.username, roleUser, team.slug)

  // find role of member in this team

  const roleCurrent = await findTeamRoleOfUser(team, member)
  logger.silly(
    '%s: has role %s in team %s',
    member.username,
    roleCurrent,
    team.slug
  )

  // define a helper function to determine seniority of roles

  const orders: ETeamRole[] = ['member', 'admin', 'owner']
  const getOrder = (role: ETeamRole) => orders.findIndex((v) => v === role)

  // disallow admins to update members with a role higher than their own

  if (getOrder(roleUser) < getOrder(roleCurrent)) {
    return next({
      status: 403,
      errors: ['updating senior members forbidden']
    })
  }

  // disallow admins to update members to a role higher than their own

  if (getOrder(roleUser) < getOrder(roleNew)) {
    return next({
      status: 403,
      errors: ['promotion not allowed']
    })
  }

  // report done if new role is same as current role

  if (roleCurrent === roleNew) {
    logger.silly('%s: %s: already has this role', member.username, team.slug)
    return res.status(204).send()
  }

  // update role of member in this team

  const groups = new Map<ETeamRole, string>([
    ['admin', 'admins'],
    ['member', 'members']
  ])

  await TeamModel.findByIdAndUpdate(team._id, {
    $push: { [groups.get(roleNew)]: member._id },
    $pull: { [groups.get(roleCurrent)]: member._id }
  })

  // remove list of team members from cache.

  await redisClient.removeCached(`route_teamMemberList_${team.slug}`)

  logger.info(
    '%s: %s: updated role of member %s from %s to %s',
    user.username,
    team.slug,
    member.username,
    roleCurrent,
    roleNew
  )

  analytics.add_activity(EActivity.TeamMemberPromoted, user._id, {
    member_id: member._id,
    new_role: roleNew,
    team_id: team._id
  })

  return res.status(204).send()
}
