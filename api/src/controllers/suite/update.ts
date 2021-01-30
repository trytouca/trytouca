/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { SuiteModel, ISuiteDocument } from '../../schemas/suite'
import { ITeam } from '../../schemas/team'
import { IUser } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'
import { rclient } from '../../utils/redis'

/**
 * Update metadata of a given suite.
 *
 * we impose the following restrictions on suite slug:
 *  - should be lowercase
 *  - should be between 3 to 16 characters
 *  - may contain alphanumeric characters as well as hyphens
 *  - should start with an alphabetic character
 *
 * @todo send email to subscribed users if suiteSlug changes
 */
export async function suiteUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('/')
  const proposed = req.body as {
    slug: string
    name: string
    retainFor: number
    sealAfter: number
  }
  logger.debug('%s: updating suite %s: %j', user.username, tuple, proposed)

  // attempt to update suite

  await SuiteModel.findOneAndUpdate({ _id: suite._id }, { $set: proposed })
  logger.info('%s: updated suite %s: %j', user.username, tuple, proposed)

  // remove information invalidated cached information.

  rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
  rclient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
  rclient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}_`)
  rclient.removeCachedByPrefix(`route_batchLookup_${team.slug}_${suite.slug}_`)

  // if suite slug has changed, redirect to the suite lookup route
  // with the new slug. otherwise, simply report that the update
  // was successful.

  if ('slug' in proposed && proposed.slug !== suite.slug) {
    logger.warn(
      '%s: suite is now known as %s/%s',
      tuple,
      team.slug,
      proposed.slug
    )
    const redirectPath = [
      config.express.root,
      'suite',
      team.slug,
      proposed.slug
    ].join('/')
    return res.status(201).location(redirectPath).send()
  }

  return res.status(204).send()
}
