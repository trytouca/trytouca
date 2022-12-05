// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'

import { BatchModel, ITeam, IUser, SuiteModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

async function clientBatchNextImpl(suiteQuery: {
  slug: string
  team: mongoose.Types.ObjectId
}): Promise<string> {
  const suite = await SuiteModel.findOne(suiteQuery, { _id: 1 })
  if (!suite) {
    return 'v1.0'
  }
  const batches = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } },
    { $project: { _id: 0, slug: 1 } },
    { $limit: 1 }
  ])
  const isNumeric = (s: string) => !isNaN(parseInt(s))
  const increment = (slug: string, delimiter: string) => {
    const t = slug.split(delimiter)
    if (t.length > 1 && isNumeric(t[t.length - 1])) {
      t[t.length - 1] = (parseInt(t[t.length - 1]) + 1).toString()
      return t.join(delimiter)
    }
  }
  if (batches.length) {
    const slug = batches[0].slug
    return increment(slug, '-') ?? increment(slug, '.') ?? 'v1.0'
  }
  return 'v1.0'
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
 */
export async function clientBatchNext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = { team: team._id, slug: req.params.suite }
  const tuple = [team.slug, suite.slug].join('_')
  logger.debug('%s: %s: showing next version', user.username, tuple)
  return res.status(200).json({ batch: await clientBatchNextImpl(suite) })
}
