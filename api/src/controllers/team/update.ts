// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { isEqual } from 'lodash-es'

import { findTeamUsersByRole } from '../../controllers/team/common.js'
import { ITeam } from '../../schemas/team.js'
import { TeamModel } from '../../schemas/team.js'
import { IUser } from '../../schemas/user.js'
import { config } from '../../utils/config.js'
import logger from '../../utils/logger.js'
import * as mailer from '../../utils/mailer.js'
import { redisClient } from '../../utils/redis.js'

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
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const tuple = [team.slug].join('/')
  const proposed = req.body as { slug: string; name: string }
  logger.debug('%s: %s: updating team', user.username, team.slug)

  // we are done if team metadata is the same as before

  if (isEqual(proposed, { name: team.name, slug: team.slug })) {
    logger.debug('%s: new metadata same as before', tuple)
    return res.status(204).json()
  }

  // if team slug is changing, check that the new slug is not already taken

  if (proposed.slug) {
    if (await TeamModel.countDocuments({ slug: proposed.slug })) {
      return next({
        errors: ['team already registered'],
        status: 409
      })
    }
  }

  // attempt to update team metadata

  await TeamModel.findByIdAndUpdate(team._id, { $set: proposed })
  logger.info('%s: updated team %s: %j', user.username, tuple, proposed)

  // remove cached responses that are invalidated.

  await redisClient.removeCached(`route_teamList_${user.username}`)
  await redisClient.removeCached(
    `route_teamLookup_${team.slug}_${user.username}`
  )

  // we are done if team slug has not changed.

  if (!('slug' in proposed) || proposed.slug === team.slug) {
    return res.status(204).json()
  }

  logger.warn('%s: team is now known as %s', tuple, proposed.slug)

  // email all members and admins of this team that the team slug has changed.

  const members = await findTeamUsersByRole(team, ['member', 'admin'])
  const teamLink = `${config.webapp.root}/~/${proposed.slug}`

  members
    // exclude the user who initiated the request
    .filter((member) => !member._id.equals(user._id))
    .map((member) => {
      mailer.mailUser(member, 'Team ID Changed', 'team-slug-changed', {
        subject: 'Team ID Changed',
        username: member.fullname || member.username,
        actorName: user.fullname,
        teamName: team.name,
        teamLink,
        oldSlug: team.slug,
        newSlug: proposed.slug
      })
    })

  // redirect to lookup route for this newly renamed team

  const redirectPath = [config.express.root, 'team', proposed.slug].join('/')
  return res.status(201).location(redirectPath).send()
}
