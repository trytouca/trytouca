/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { isEqual } from 'lodash'

import { findTeamUsersByRole } from './common'
import { ETeamRole } from '../../commontypes'
import { TeamModel } from '../../schemas/team'
import { ITeam } from '../../schemas/team'
import { IUser, UserModel } from '../../schemas/user'
import logger from '../../utils/logger'
import { config } from '../../utils/config'
import * as mailer from '../../utils/mailer'
import { rclient } from '../../utils/redis'

/**
 * @summary
 * Updates metadata of a given team.
 *
 * @description
 * User making this request must be owner of team being updated.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamOwner`
 */
export async function teamUpdate(
  req: Request, res: Response, next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const proposed = req.body as { slug: string, name: string }
  logger.debug('%s: %s: updating team', user.username, team.slug)

  // attempt to update team metadata

  if (isEqual(proposed, { name: team.name, slug: team.slug })) {
    logger.debug('%s: new metadata same as before', team.name)
    return res.status(204).json()
  }

  // if team slug is changing, check that the new slug is not already taken

  if (proposed.slug) {
    if (await TeamModel.countDocuments({ slug: proposed.slug })) {
      return next({
        errors: [ 'team already registered' ],
        status: 409
      })
    }
  }

  // update the database

  await TeamModel.findByIdAndUpdate(team._id, { $set: proposed })
  logger.info('%s: %s: updated metadata of team: %j', user.username, team.slug, proposed)

  // remove information about this team and the list of known teams from cache.
  // we wait for these operations to avoid race conditions.

  await rclient.removeCached(`route_teamList_${user.username}`)
  await rclient.removeCached(`route_teamLookup_${team.slug}_${user.username}`)

  // we are done if team slug has not changed.

  if (!proposed.slug || proposed.slug.localeCompare(team.slug) == 0) {
    return res.status(204).json()
  }

  logger.warn('%s: team is now known as %s', team.slug, proposed.slug)

  // email all members and admins of this team that the team slug has changed.

  const members = await findTeamUsersByRole(team, [ ETeamRole.Member, ETeamRole.Admin ])
  const teamLink = `${config.webapp.root}/~/${proposed.slug}`

  members
    // exclude the user who initiated the request
    .filter(member => !member._id.equals(user._id))
    .map(member => {
      mailer.mailUser(member, 'Team ID Changed', 'team-slug-changed', {
        subject: 'Team ID Changed',
        username: member.fullname || member.username,
        actorName: user.fullname,
        teamName: team.name,
        teamLink,
        oldSlug: team.slug,
        newSlug: proposed.slug,
      })
    })

  // redirect to lookup route for this newly renamed team

  const redirectPath = [ config.express.root, 'team', proposed.slug ].join('/')
  return res.status(201).location(redirectPath).send()
}
