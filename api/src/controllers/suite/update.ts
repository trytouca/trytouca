/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { isEqual } from 'lodash'

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

  // we are done if suite metadata is the same as before

  if (isEqual(proposed, { name: team.name, slug: team.slug })) {
    logger.debug('%s: new metadata same as before', tuple)
    return res.status(204).json()
  }

  // if suite slug is changing, check that the new slug is not already taken

  if (proposed.slug) {
    if (
      await SuiteModel.countDocuments({ slug: proposed.slug, team: team._id })
    ) {
      return next({
        errors: ['suite already registered'],
        status: 409
      })
    }
  }

  // attempt to update suite metadata

  await SuiteModel.findOneAndUpdate({ _id: suite._id }, { $set: proposed })
  logger.info('%s: updated suite %s: %j', user.username, tuple, proposed)

  // remove cached responses that are invalidated.

  rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
  rclient.removeCachedByPrefix(`route_suiteList_${team.slug}_`)
  rclient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}_`)
  rclient.removeCachedByPrefix(`route_batchLookup_${team.slug}_${suite.slug}_`)

  // we are done if suite slug has not changed.

  if (!('slug' in proposed) || proposed.slug === suite.slug) {
    return res.status(204).json()
  }

  // if suite slug has changed, redirect to the suite lookup route
  // with the new slug. otherwise, simply report that the update
  // was successful.

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
