/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { ITeam, TeamModel } from '../schemas/team'
import { IUser, UserModel } from '../schemas/user'
import logger from '../utils/logger'

/**
 * @summary
 * Checks if a team exists.
 *
 * @description
 * Checks if a team whose slug is specified in request parameter
 * as `team` exists.
 *
 * - Populates local response variables: `team`.
 * - Expects request parameters: `team`
 * - Expects local response variables: N/A
 * - Database Queries: 1
 *
 * @returns
 * - Error 404 if team (`team`) is not registered or is suspended.
 */
export async function hasTeam(req: Request, res: Response, next: NextFunction) {
  const teamSlug = req.params.team
  const team = await TeamModel.findOne({ slug: teamSlug, suspended: false })

  // return 404 if team with specified name does not exist

  if (!team) {
    return next({
      errors: ['team not found'],
      status: 404
    })
  }

  logger.silly('%s: team exists', team.slug)
  res.locals.team = team
  return next()
}

/**
 * @summary
 * Checks if user `user` has invitation to join team `team`.
 *
 * @description
 *
 * - Populates local response variables: N/A.
 * - Expects request parameters: N/A
 * - Expects local response variables: `user`, `team`
 * - Database Queries: 1
 *
 * @returns
 *  - Error 403 if user `user` is not on invite list of team `team`.
 */
export async function isTeamInvitee(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam

  const isInvitee = await TeamModel.countDocuments({
    _id: team._id,
    invitees: { $elemMatch: { email: user.email } }
  })
  if (!isInvitee) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  logger.silly('%s: is invited to team %s', user.username, team.slug)
  return next()
}

/**
 * @summary
 * Checks if user `user` is member of team `team`.
 *
 * @description
 *
 * - Populates local response variables: N/A.
 * - Expects request parameters: N/A
 * - Expects local response variables: `user`, `team`
 * - Database Queries: 1
 *
 * @returns
 *  - Error 403 if user `user` is not member of team `team`.
 */
export async function isTeamMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam

  const isMember = await TeamModel.countDocuments({
    _id: team._id,
    $or: [
      { members: { $in: user._id } },
      { admins: { $in: user._id } },
      { owner: user._id }
    ]
  })

  if (!isMember) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  logger.silly('%s: is member of team %s', user.username, team.slug)
  return next()
}

/**
 * @summary
 * Checks if user `user` is admin of team `team`.
 *
 * @description
 *
 * - Populates local response variables: N/A.
 * - Expects request parameters: N/A
 * - Expects local response variables: `user`, `team`
 * - Database Queries: 1
 *
 * @returns
 *  - Error 403 if user `user` is not admin of team `team`.
 */
export async function isTeamAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam

  const isAdmin = await TeamModel.countDocuments({
    _id: team._id,
    $or: [{ admins: { $in: user._id } }, { owner: user._id }]
  })
  if (!isAdmin) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  logger.silly('%s: is admin of team %s', user.username, team.slug)
  return next()
}

/**
 * @summary
 * Checks if user `user` is owner of team `team`.
 *
 * @description
 *
 * - Populates local response variables: N/A.
 * - Expects request parameters: N/A
 * - Expects local response variables: `user`, `team`
 * - Database Queries: 1
 *
 * @returns
 *  - Error 403 if user `user` is not owner of team `team`.
 */
export async function isTeamOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam

  const isOwner = await TeamModel.countDocuments({
    _id: team._id,
    owner: user._id
  })
  if (!isOwner) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }

  logger.silly('%s: is owner of team %s', user.username, team.slug)
  return next()
}

/**
 * @summary
 * Checks if user `member` is a member of team `team`.
 *
 * @description
 * Check if a user (whose username is specified in request parameter
 * as `member` is a member of team `team`.
 *
 * - Populates local response variables: `member`.
 * - Expects request parameters: `member`
 * - Expects local response variables: `team`
 * - Database Queries: 2
 *
 * @returns
 * - Error 404 if member `member` is not a member of team `team`.
 */
export async function hasMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = (res.locals.team as ITeam) as ITeam
  const username = req.params.member

  // check that the user exists

  const member = await UserModel.wslFindByUname(username)
  if (!member) {
    return next({
      errors: ['member not found'],
      status: 404
    })
  }

  // check that the user has a role in this team

  const isMember = await TeamModel.countDocuments({
    _id: team._id,
    suspended: false,
    $or: [
      { admins: { $in: member._id } },
      { members: { $in: member._id } },
      { owner: member._id }
    ]
  })
  if (!isMember) {
    return next({
      errors: ['member not found'],
      status: 404
    })
  }

  logger.silly('%s: is member of team %s', username, team.slug)
  res.locals.member = member
  return next()
}
