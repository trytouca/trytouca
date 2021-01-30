/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { TeamModel } from '../../schemas/team'
import { UserModel } from '../../schemas/user'
import logger from '../../utils/logger'
import { rclient } from '../../utils/redis'

/**
 * @summary
 * Rescinds invitation to join this team.
 *
 * @description
 * User whose email is posted must be on invitation list of this team.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamAdmin`
 * Expects `email` field in request body.
 *
 * - Database Queries: 2
 */
export async function teamInviteRescind(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user
  const team = res.locals.team
  const askedEmail = req.body.email
  const tuple = [user.username, team.slug, askedEmail]
  logger.debug('%s: rescinding invitation to team %s for %s', ...tuple)

  // check if user is already invited

  type Invitee = { email: string; invitedAt: Date }
  const result: Invitee[] = await TeamModel.aggregate([
    {
      $match: { _id: team._id, invitees: { $elemMatch: { email: askedEmail } } }
    },
    { $unwind: '$invitees' },
    { $project: { _id: 0, invitees: 1 } },
    { $replaceRoot: { newRoot: '$invitees' } }
  ])
  const alreadyInvited = result.length === 0 ? null : result[0]

  // reject the request if user was not on invitation list

  if (!alreadyInvited) {
    return next({
      errors: ['user not invited'],
      status: 404
    })
  }

  // update database list and remove user from invitation list

  await TeamModel.findByIdAndUpdate(team._id, {
    $pull: { invitees: { email: askedEmail } }
  })
  logger.info('%s: rescinded invitation to team %s for %s', ...tuple)

  // remove list of team members from cache.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)

  // if user was registered, refresh their team list

  const isRegistered = await UserModel.findOne(
    { email: askedEmail },
    { username: 1 }
  )

  if (isRegistered) {
    await rclient.removeCached(`route_teamList_${isRegistered.username}`)
  }

  return res.status(204).send()
}
