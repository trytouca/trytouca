/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { batchSeal } from '@/models/batch'
import { IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'

/**
 * @summary
 * Seal a given version of a suite in a team.
 *
 * @description
 * Seals a batch `batch` of a suite `suite` to prevent further submission
 * of results in the future.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasBatch` to yield `batch`
 */
export async function ctrlBatchSeal(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  logger.debug('%s: %s: sealing', user.username, tuple)

  // we are done if batch is already sealed

  if (batch.sealedAt) {
    logger.info('%s: %s: already sealed', user.username, tuple)
    return res.status(204).send()
  }

  // perform sealing of the batch

  await batchSeal(team, suite, batch)
  logger.info('%s: %s: sealed', user.username, tuple)

  return res.status(204).send()
}
