// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { findTeamRoleOfUser } from '@/controllers/team/common'
import { ITeam, TeamModel } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import type { TeamLookupResponse } from '@/types/commontypes'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

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
        userCount: {
          $let: {
            vars: {
              membersCount: { $size: '$members' },
              adminsCount: { $size: '$admins' }
            },
            in: { $sum: ['$$membersCount', '$$adminsCount', 1] }
          }
        }
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

  if (await rclient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await rclient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform database lookup

  const output = await teamLookup(user, team)

  // cache list result

  rclient.cache(cacheKey, output)

  // log runtime performance before returning

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
