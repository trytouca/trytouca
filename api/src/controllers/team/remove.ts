// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { suiteRemove } from '@/models/suite'
import { BatchModel } from '@/schemas/batch'
import { MessageModel } from '@/schemas/message'
import { SuiteModel } from '@/schemas/suite'
import { ITeam, TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import logger from '@/utils/logger'
import { redisClient } from '@/utils/redis'
import { analytics, EActivity } from '@/utils/tracker'

/**
 * Removes a given team and all data associated with it.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamOwner`
 */
export async function ctrlTeamRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug].join('/')
  logger.info('%s: removing %s', user.username, tuple)
  const tic = process.hrtime()

  // due that a team may have messages whose associated comparison
  // jobs may be pending or in progress, removing them instantaneously
  // is not possible. instead, we mark all messages of this team as
  // expired to enable their eventual removal by the data retention
  // policy enforcement service.

  const suites = await SuiteModel.find({ team: team._id })
  const suiteIds = suites.map((v) => v._id)
  const batches = await BatchModel.find(
    { suite: { $in: suiteIds } },
    { _id: 1 }
  )
  const batchIds = batches.map((v) => v._id)

  await MessageModel.updateMany(
    { batchId: { $in: batchIds } },
    { $set: { expiresAt: new Date() } }
  )

  // attempt to remove suites

  for (const suite of suites) {
    await suiteRemove(suite)
  }

  if ((await SuiteModel.countDocuments({ team: team._id })) !== 0) {
    logger.info('%s: %s: failed to remove some suites', user.username, tuple)
    return next({
      errors: ['scheduled removal'],
      status: 202
    })
  } else {
    await UserModel.updateMany(
      { teams: { $elemMatch: { $eq: team._id } } },
      { $pull: { teams: team._id } }
    )
    await UserModel.updateMany(
      { prospectiveTeams: { $elemMatch: { $eq: team._id } } },
      { $pull: { prospectiveTeams: team._id } }
    )
    await TeamModel.findByIdAndRemove(team._id)
    logger.info('%s: removed team', team.slug)

    redisClient.removeCachedByPrefix(`route_teamLookup_${team.slug}_`)
    redisClient.removeCachedByPrefix(`route_teamList_`)
  }

  analytics.add_activity(EActivity.TeamDeleted, user._id, { team_id: team._id })

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled request in %d ms', tuple, toc.toFixed(0))
  return res.status(204).send()
}
