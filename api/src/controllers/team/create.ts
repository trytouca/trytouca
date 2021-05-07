/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { teamCreate } from '@weasel/models/team'
import { IUser } from '@weasel/schemas/user'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'
import { rclient } from '@weasel/utils/redis'
import { tracker } from '@weasel/utils/tracker'
import { NextFunction, Request, Response } from 'express'

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
export async function ctrlTeamCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const proposed = req.body as { slug: string; name: string }
  logger.debug('%s: creating team %s', user.username, proposed.slug)

  // return 409 if team slug is taken

  if (!(await teamCreate(user, proposed))) {
    return next({
      errors: ['team already registered'],
      status: 409
    })
  }

  // notify platform admins that a new team was created

  mailer.mailAdmins({
    title: 'New Team Registered',
    body: `User <b>${user.username}</b> created team <b>${proposed.slug}</b>.`
  })

  // remove information about the list of known teams from cache.
  // we intentionally wait for this operation to avoid race conditions

  await rclient.removeCached(`route_teamList_${user.username}`)

  // add event to tracking system

  tracker.track(user, 'created_team')

  // redirect to lookup route for this newly created team

  const redirectPath = [config.express.root, 'team', proposed.slug].join('/')
  return res.status(201).redirect(redirectPath.replace(/\/+/g, '/'))
}
