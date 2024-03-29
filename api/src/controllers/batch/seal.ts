// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { batchSeal } from '../../models/index.js'
import {
  IBatchDocument,
  ISuiteDocument,
  ITeam,
  IUser
} from '../../schemas/index.js'
import { analytics, logger } from '../../utils/index.js'

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
  if (batch.sealedAt) {
    logger.info('%s: %s: already sealed', user.username, tuple)
    return res.status(204).send()
  }
  await batchSeal(team, suite, batch)
  analytics.add_activity('batch:sealed', user)
  logger.info('%s: %s: sealed', user.username, tuple)
  return res.status(204).send()
}
