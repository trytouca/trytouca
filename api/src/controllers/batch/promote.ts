/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { ComparisonFunctions } from '../../controllers/comparison'
import { IUser } from '../../schemas/user'
import { ITeam } from '../../schemas/team'
import { ISuiteDocument, SuiteModel } from '../../schemas/suite'
import { IBatchDocument, BatchModel } from '../../schemas/batch'
import { ReportModel, EReportType } from '../../schemas/report'
import logger from '../../utils/logger'
import { rclient } from '../../utils/redis'

/**
 *
 */
async function batchPromote(
  team: ITeam,
  suite: ISuiteDocument,
  batch: IBatchDocument,
  user: IUser,
  reason: string
): Promise<void> {
  const tuple = [team.slug, suite.slug, batch.slug].join('/')

  // perform promotion of batch

  const baselineInfo = suite.promotions[suite.promotions.length - 1]

  const entry: ISuiteDocument['promotions'][0] = {
    at: new Date(),
    by: user._id,
    for: reason,
    from: baselineInfo.to,
    to: batch._id
  }

  await SuiteModel.findByIdAndUpdate(suite._id, {
    $push: { promotions: entry }
  })
  suite.promotions.push(entry)

  logger.info('%s: %s: promoted to baseline', user.username, tuple)

  // find batches with more recent submission date than this batch, and:
  //  * update their `superior` field to have them compare against this
  //    batch by default.
  //  * remove their `meta` field which was based on comparison with the
  //    previous baseline. we leave it to analytics service to re-populate
  //    this field.
  //  * create comparison jobs for them against this batch.
  //    Without this step, comparison jobs will only be created after the
  //    user asks for the comparison result, e.g. by navigating to the batch
  //    page, which is too late to correctly respond to requests such as for
  //    the list of batches.

  const batches = await BatchModel.find({
    suite: suite._id,
    submittedAt: { $gt: batch.submittedAt }
  })

  if (batches.length) {
    logger.info('%s: refreshing metadata of %d batches', tuple, batches.length)

    batches.forEach((v) => ComparisonFunctions.compareBatch(batch._id, v._id))

    await BatchModel.updateMany(
      { _id: { $in: batches.map((raw) => raw._id) } },
      { $set: { superior: batch._id }, $unset: { meta: true } }
    )
  }

  // remove information about list of known suites from cache.
  // we wait for this operation to avoid race condition.

  await rclient.removeCached(`route_suiteLookup_${team.slug}_${suite.slug}`)
  rclient.removeCachedByPrefix(`route_batchList_${team.slug}_${suite.slug}_`)

  // find id of the latest batch

  const result: IBatchDocument[] = await BatchModel.aggregate([
    { $match: { suite: suite._id } },
    { $sort: { submittedAt: -1 } },
    { $limit: 1 },
    { $project: { _id: 1 } }
  ])

  const srcBatchId = result[0]._id
  const dstBatchId = batch._id

  // create a comparison report job between the latest batch and this batch.
  // note that we do this, even if this batch is the same as the latest batch.
  // we rely on reporting service to send notifications, to reuse the same
  // logic for this special case.

  await ReportModel.create({
    srcBatchId,
    dstBatchId,
    reportType: EReportType.Promote
  })
  logger.info('%s: created reporting job against latest', tuple)
}

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
 *
 * - Database Queries: 2
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

  return res.status(204).send()
}
