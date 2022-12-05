// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { TeamLookupResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { findTeamRoleOfUser } from '../../models/index.js'
import { ITeam, IUser, TeamModel } from '../../schemas/index.js'
import { logger, redisClient } from '../../utils/index.js'

/**
 * Lookup detailed information about a team.
 *
 * @internal
 */
async function teamLookup(
  user: IUser,
  team: ITeam
): Promise<TeamLookupResponse> {
  type DatabaseOutput = TeamLookupResponse[]

  const result: DatabaseOutput = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    {
      $project: {
        _id: 0,
        name: 1,
        slug: 1,
        membersCount: { $size: '$members' },
        adminsCount: { $size: '$admins' },
        userCount: { $size: '$members' }
      }
    }
  ])

  // thanks to previously run middleware, we can rely that there is
  // one team with the given id, and this user is a member of this team.
  // therefore, the database query is guaranteed to yield one and only one
  // result.

  const output = result[0]
  output.role = await findTeamRoleOfUser(team, user)

  return output
}

/**
 * @summary
 * Lookup information for a given team.
 *
 * @description
 * Does not provide list of members, admins or owners.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *
 * Caches output returned for each user.
 */
export async function ctrlTeamLookup(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  logger.debug('%s: %s: looking up team', user.username, team.slug)
  const cacheKey = `route_teamLookup_${team.slug}_${user.username}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform database lookup

  const output = await teamLookup(user, team)

  // cache list result

  redisClient.cache(cacheKey, output)

  // log runtime performance before returning

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
