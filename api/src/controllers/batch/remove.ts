// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { batchRemove, compareBatch } from '../../models/index.js'
import {
  BatchModel,
  IBatchDocument,
  ISuiteDocument,
  ITeam,
  IUser,
  MessageModel,
  SuiteModel
} from '../../schemas/index.js'
import { analytics, logger } from '../../utils/index.js'

/**
 * @summary
 * Removes a batch and all data associated with it.
 *
 * @description
 * Batch must be sealed.
 * Batch must not be baseline of the suite it belongs to.
 */
export async function ctrlBatchRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  logger.info('%s: %s: removing', user.username, tuple)
  const tic = process.hrtime()

  // reject if batch is not sealed
  if (!batch.sealedAt) {
    return next({
      errors: ['batch not sealed'],
      status: 400
    })
  }

  // reject if batch is baseline of suite
  if (suite.promotions.length !== 0) {
    const baselineInfo = suite.promotions[suite.promotions.length - 1]
    if (batch._id.equals(baselineInfo.to)) {
      return next({
        errors: ['refusing to remove suite baseline'],
        status: 400
      })
    }
  }

  // at this point, we establish the request as credible and proceed
  // to following it.
  // Since this operation is time-consuming we choose to provide feedback
  // to the client that their request is Accepted before processing it.
  res.status(202).send()

  // given that a batch may have messages whose associated comparison jobs may
  // be pending or in progress, removing them instantaneously is not possible.
  // instead, we mark all messages of this batch as expired to enable their
  // eventual removal by the data retention policy enforcement service.
  await MessageModel.updateMany(
    { batchId: batch._id },
    { $set: { expiresAt: new Date() } }
  )

  // attempt removal of this batch.
  // note that if there are pending comparison jobs for any message associated
  // with this batch, we are going to report that we removed the batch even if
  // those pending comparison jobs and their associated messages along with
  // the batch itself will be removed in an indeterminate time.
  if (!(await batchRemove(batch))) {
    logger.info('%s: %s: scheduled for removal', user.username, tuple)
  }
  analytics.add_activity('batch:deleted', user, { batch: tuple })

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', tuple, toc.toFixed(0))
}
