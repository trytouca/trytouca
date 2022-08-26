// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import coerce from 'semver/functions/coerce'
import inc from 'semver/functions/inc'
import valid from 'semver/functions/valid'

import { BatchModel } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'

async function clientBatchNextImpl(suite: ISuiteDocument): Promise<string> {
  const batches = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } },
    { $project: { _id: 0, slug: 1 } },
    { $limit: 1 }
  ])
  if (batches.length) {
    const coerced = coerce(batches[0].slug)
    return valid(coerced) ? inc(coerced, 'patch', { loose: true }) : 'v0.1.0'
  }
  return 'v0.1.0'
}

/**
 * @summary
 * Return the next common-sense version increment for this suite.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isClientAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 */
export async function clientBatchNext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: showing next version', user.username, tuple)
  return res.status(200).json({ batch: await clientBatchNextImpl(suite) })
}
