/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { SuiteModel } from '../../schemas/suite'
import { ITeam } from '../../schemas/team'
import { IUser } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'
import { rclient } from '../../utils/redis'

/**
 * Register a new suite.
 *
 * we impose the following restrictions on suite slug:
 *  - should be lowercase
 *  - should be between 3 to 16 characters
 *  - may contain alphanumeric characters as well as hyphens
 *  - should start with an alphabetic character
 */
export async function suiteCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const proposed = req.body as { slug: string; name: string }
  const tuple = [team.slug, proposed.slug].join('/')
  logger.debug('%s: creating suite %s', user.username, tuple)

  // return 409 if suite slug is taken

  if (
    await SuiteModel.countDocuments({ slug: proposed.slug, team: team._id })
  ) {
    return next({
      errors: ['suite already registered'],
      status: 409
    })
  }

  // register suite in database

  const newSuite = await SuiteModel.create({
    createdBy: user._id,
    name: proposed.name,
    slug: proposed.slug,
    subscribers: [user._id],
    team: team._id
  })
  logger.info('%s: created suite %s', user.username, tuple)

  // remove information about the list of known suites from cache.
  // we intentionally wait for this operation to avoid race conditions

  await rclient.removeCached(`route_suiteList_${team.slug}_${user.username}`)

  // redirect to lookup route for this newly created suite

  const redirectPath = [
    config.express.root,
    'suite',
    team.slug,
    newSuite.slug
  ].join('/')
  return res.status(201).redirect(redirectPath.replace(/\/+/g, '/'))
}
