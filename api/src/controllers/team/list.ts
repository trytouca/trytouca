// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole, TeamItem, TeamListResponse } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'

import { ITeamDocument, TeamModel } from '../../schemas/team.js'
import { IUser, UserModel } from '../../schemas/user.js'
import { config } from '../../utils/config.js'
import logger from '../../utils/logger.js'
import { redisClient } from '../../utils/redis.js'

/**
 * Provides list of teams for a given user.
 *
 * @internal
 */
async function teamList(user: IUser): Promise<TeamListResponse> {
  type DatabaseOutput = {
    slug: string
    name: string
    owner: Types.ObjectId
    admins: Types.ObjectId[]
    members: Types.ObjectId[]
  }

  const result: DatabaseOutput[] = await UserModel.aggregate([
    { $match: { _id: user._id } },
    {
      $lookup: {
        from: 'teams',
        localField: 'teams',
        foreignField: '_id',
        as: 'teamDocs'
      }
    },
    {
      $project: {
        _id: 0,
        'teamDocs.slug': 1,
        'teamDocs.name': 1,
        'teamDocs.owner': 1,
        'teamDocs.admins': 1,
        'teamDocs.members': 1
      }
    },
    {
      $unwind: '$teamDocs'
    },
    {
      $replaceRoot: { newRoot: '$teamDocs' }
    }
  ])

  const getRole = (v: DatabaseOutput): ETeamRole => {
    if (v.owner.equals(user._id)) {
      return 'owner'
    }
    if (v.admins.some((v) => v.equals(user._id))) {
      return 'admin'
    }
    if (v.members.some((v) => v.equals(user._id))) {
      return 'member'
    }
    return 'unknown'
  }

  return result.map(
    (v): TeamItem => ({
      name: v.name,
      role: getRole(v),
      slug: v.slug
    })
  )
}

/**
 * Provides list of teams that the user is requesting to join.
 *
 * @internal
 */
async function prospectiveTeamList(user: IUser): Promise<TeamListResponse> {
  type DatabaseOutput = {
    slug: string
    name: string
    applicants: Types.ObjectId[]
  }

  const result: DatabaseOutput[] = await UserModel.aggregate([
    { $match: { _id: user._id } },
    {
      $lookup: {
        from: 'teams',
        localField: 'prospectiveTeams',
        foreignField: '_id',
        as: 'teamDocs'
      }
    },
    {
      $project: {
        _id: 0,
        'teamDocs.slug': 1,
        'teamDocs.name': 1,
        'teamDocs.applicants': 1
      }
    },
    {
      $unwind: '$teamDocs'
    },
    {
      $replaceRoot: { newRoot: '$teamDocs' }
    }
  ])

  const getRole = (v: DatabaseOutput): ETeamRole => {
    if (v.applicants.some((v) => v.equals(user._id))) {
      return 'applicant'
    }
    return 'unknown'
  }

  return result.map(
    (v): TeamItem => ({
      name: v.name,
      role: getRole(v),
      slug: v.slug
    })
  )
}

/**
 * @summary
 * Lists teams in which user has a role.
 *
 * @description
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *
 * Caches output returned for each user.
 */
export async function ctrlTeamList(
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const user = res.locals.user as IUser
  logger.debug('%s: listing teams', user.username)
  const cacheKey = `route_teamList_${user.username}`
  const tic = process.hrtime()

  // return result from cache in case it is available

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform lookup

  const active = await teamList(user)
  const prospective = await prospectiveTeamList(user)
  const teams = await TeamModel.find({
    invitees: { $elemMatch: { email: user.email } }
  })
  const invited = teams.map((v: ITeamDocument) => ({
    name: v.name,
    slug: v.slug,
    role: 'invited'
  }))
  const output = [...active, ...prospective, ...invited]

  // cache list result

  redisClient.cache(cacheKey, output, config.redis.durationLong)

  // log runtime performance before returning

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.debug('%s: handled request in %d ms', cacheKey, toc.toFixed(0))
  return res.status(200).json(output)
}
