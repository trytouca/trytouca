/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { TeamModel } from '../../schemas/team'
import { IUser, UserModel } from '../../schemas/user'
import logger from '../../utils/logger'
import { config } from '../../utils/config'
import * as mailer from '../../utils/mailer'
import { rclient } from '../../utils/redis'

/**
 * @summary
 * Creates a new team for this user.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *
 * Performs up to three database queries.
 */
export async function teamCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const proposed = req.body as { slug: string; name: string }
  logger.debug('%s: creating team %s', user.username, proposed.slug)

  // return 400 if team slug is taken

  if (await TeamModel.countDocuments({ slug: proposed.slug })) {
    return next({
      errors: ['team already registered'],
      status: 409
    })
  }

  // register team in database

  const newTeam = await TeamModel.create({
    name: proposed.name,
    owner: user._id,
    slug: proposed.slug
  })
  logger.info('%s: created team %s', user.username, proposed.slug)

  // add a reference to this team in the user document

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { teams: newTeam._id }
  })

  // notify platform admins that a new team was created

  const subject = 'New Team Registered'
  mailer.mailAdmins(subject, 'team-create-admin', {
    subject,
    teamName: newTeam.name,
    teamSlug: newTeam.slug,
    username: user.username
  })

  // remove information about the list of known teams from cache.
  // we intentionally wait for this operation to avoid race conditions

  await rclient.removeCached(`route_teamList_${user.username}`)

  // redirect to lookup route for this newly created team

  const redirectPath = [config.express.root, 'team', newTeam.slug].join('/')
  return res.status(201).redirect(redirectPath.replace(/\/+/g, '/'))
}
