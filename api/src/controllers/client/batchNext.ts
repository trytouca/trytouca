// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { batchNext } from '../../models/index.js'
import { ITeam, IUser, SuiteModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function clientBatchNext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suiteSlug = req.params.suite
  const tuple = [team.slug, suiteSlug].join('_')
  logger.debug('%s: %s: showing next version', user.username, tuple)
  const suite = await SuiteModel.findOne(
    {
      slug: suiteSlug,
      team: team._id
    },
    { _id: 1 }
  )
  const batch = suite ? await batchNext(suite._id) : 'v1.0'
  return res.status(200).json({ batch })
}
