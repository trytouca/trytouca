// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { batchPromote } from '@/models/batch'
import { IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument, SuiteModel } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { tracker } from '@/utils/tracker'

/**
 * @summary
 * Promotes a given batch to the baseline of the suite it belongs to.
 *
 * @description
 * Batch must be sealed.
 * Batch should not be empty.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasBatch` to yield `batch`
 *
 * Expects `reason` field in request body.
 */
export async function ctrlBatchPromote(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const reason: string = req.body.reason
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  logger.info('%s: %s: promoting to baseline', user.username, tuple)

  // check if batch is already set as suite baseline
  //
  // note that this check precedes the check for whether the batch is
  // sealed. The reason is our exceptional treatement of the first
  // submitted batch which is automatically promoted as baseline
  // without sealing. refer to comment block in submissions controller
  // for more information.

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  if (batch._id.equals(baselineInfo.to)) {
    logger.debug('%s: %s: is baseline already', user.username, tuple)

    // we are done if promotion reason is the same as before.
    // otherwise, simply update the promotion reason

    if (reason !== baselineInfo.for) {
      logger.silly('%s: updating promotion reason', tuple)
      await SuiteModel.updateOne(
        { _id: suite._id, promotions: { $elemMatch: { at: baselineInfo.at } } },
        { 'promotions.$.for': reason }
      )
      logger.info('%s: %s: updated promotion reason', user.username, tuple)
      return res.status(204).send()
    }
  }

  // we do not allow users to promote baseline of the suite to
  // a batch that is not sealed.

  if (!batch.sealedAt) {
    return next({
      errors: ['batch is not sealed'],
      status: 400
    })
  }

  // we do not allow users to promote baseline of the suite to
  // a batch with no message.

  if (batch.elements.length === 0) {
    return next({
      errors: ['batch is empty'],
      status: 400
    })
  }

  // perform promotion of the batch

  await batchPromote(team, suite, batch, user, reason)
  logger.info('%s: %s: promoted', user.username, tuple)

  // add event to tracking system

  tracker.track(user, 'promoted_batch')

  return res.status(204).send()
}
