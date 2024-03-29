// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { teamCreate } from '../../models/index.js'
import { IUser } from '../../schemas/index.js'
import {
  analytics,
  logger,
  mailAdmins,
  redisClient
} from '../../utils/index.js'

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
  mailAdmins({
    title: 'New Team Registered',
    body: `User <b>${user.username}</b> created team <b>${proposed.slug}</b>.`
  })

  // remove information about the list of known teams from cache.
  // we intentionally wait for this operation to avoid race conditions
  await redisClient.removeCached(`route_teamList_${user.username}`)

  analytics.add_activity('team:created', user)
  return res.status(201).send()
}
