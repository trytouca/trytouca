// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { suiteRemove } from '@/models/suite'
import { BatchModel } from '@/schemas/batch'
import { MessageModel } from '@/schemas/message'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { analytics, EActivity } from '@/utils/tracker'

/**
 * Remove a given suite and all data associated with it.
 */
export async function ctrlSuiteRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug, suite.slug].join('/')
  logger.info('%s: removing %s', user.username, tuple)
  const tic = process.hrtime()

  // at this point, we establish the request as credible and proceed
  // to following it.
  // Since this operation is time-consuming we choose to provide feedback
  // to the client that their request is Accepted before processing it.

  res.status(202).send()

  // due that a suite may have messages whose associated comparison
  // jobs may be pending or in progress, removing them instantaneously
  // is not possible. instead, we mark all messages of this suite as
  // expired to enable their eventual removal by the data retention
  // policy enforcement service.

  const batches = await BatchModel.find({ suite: suite._id }, { _id: 1 })

  await MessageModel.updateMany(
    { batchId: { $in: batches.map((v) => v._id) } },
    { $set: { expiresAt: new Date() } }
  )

  // attempt removal of this suite.
  // note that if there are pending comparison jobs for any message
  // associated with this suite, we are going to report that we
  // removed the suite even if those pending comparison jobs and
  // their associated messages along with the suite itself will be
  // removed in an indeterminate time.

  if (!(await suiteRemove(suite))) {
    logger.info('%s: %s: scheduled for removal', user.username, tuple)
  }

  analytics.add_activity(EActivity.SuiteDeleted, user._id, {
    suite_id: suite._id
  })

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled request in %d ms', tuple, toc.toFixed(0))
}
