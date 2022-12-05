// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type {
  ETeamRole,
  TeamMember,
  TeamMemberListResponse
} from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { ITeam, IUser, TeamModel } from '../../schemas/index.js'
import { logger, redisClient } from '../../utils/index.js'

/**
 * Lookup list of members of a given team from database
 *
 * @internal
 */
async function teamMemberListImpl(
  team: ITeam
): Promise<TeamMemberListResponse> {
  type DbMember = { username: string; fullname: string }
  type DbInvitee = { email: string; fullname: string; invitedAt: Date }
  type DbApplicant = { email: string; fullname: string; username: string }
  type DatabaseOutput = {
    owner: DbMember
    admins: DbMember[]
    members: DbMember[]
    invitees: DbInvitee[]
    applicants: DbApplicant[]
  }

  const result: DatabaseOutput[] = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    {
      $lookup: {
        from: 'users',
        localField: 'members',
        foreignField: '_id',
        as: 'memberDocs'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'admins',
        foreignField: '_id',
        as: 'adminDocs'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDoc'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'applicants',
        foreignField: '_id',
        as: 'applicantDocs'
      }
    },
    {
      $project: {
        _id: 0,
        ownerDoc: {
          fullname: 1,
          username: 1
        },
        adminDocs: 1,
        memberDocs: 1,
        invitees: 1,
        applicantDocs: 1
      }
    },
    { $unwind: '$ownerDoc' },
    {
      $unwind: {
        path: '$memberDocs',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: 'memberDocs',
        ownerDoc: { $first: '$ownerDoc' },
        adminDocs: { $first: '$adminDocs' },
        members: {
          $push: {
            fullname: '$memberDocs.fullname',
            username: '$memberDocs.username'
          }
        },
        invitees: { $first: '$invitees' },
        applicantDocs: { $first: '$applicantDocs' }
      }
    },
    {
      $unwind: {
        path: '$adminDocs',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: null,
        owner: { $first: '$ownerDoc' },
        admins: {
          $push: {
            fullname: '$adminDocs.fullname',
            username: '$adminDocs.username'
          }
        },
        members: { $first: '$members' },
        invitees: { $first: '$invitees' },
        applicantDocs: { $first: '$applicantDocs' }
      }
    },
    {
      $unwind: {
        path: '$applicantDocs',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: null,
        owner: { $first: '$owner' },
        admins: { $first: '$admins' },
        members: { $first: '$members' },
        invitees: { $first: '$invitees' },
        applicants: {
          $push: {
            email: '$applicantDocs.email',
            fullname: '$applicantDocs.fullname',
            username: '$applicantDocs.username'
          }
        }
      }
    }
  ])

  const output: TeamMemberListResponse = {
    applicants: result[0].applicants.filter((v) => Object.keys(v).length),
    invitees: result[0].invitees.map((v) => ({
      ...v,
      invitedAt: v.invitedAt as unknown as string
    })),
    members: result[0].members
      .filter((v) => Object.keys(v).length)
      .map((el) => ({ ...el, role: 'member' } as TeamMember))
      .concat(
        result[0].admins
          .filter((v) => Object.keys(v).length)
          .map((el) => ({ ...el, role: 'admin' } as TeamMember))
      )
      .concat([{ ...result[0].owner, role: 'owner' } as TeamMember])
      .sort((a: TeamMember, b: TeamMember) => {
        const orders: ETeamRole[] = ['member', 'admin', 'owner']
        return orders.indexOf(a.role) - orders.indexOf(b.role)
      })
  }

  return output
}

/**
 * @summary
 * Lists members of a given team and their role within that team.
 *
 * @description
 * Also includes list of people invited to join this team.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *
 * Caches the returned output.
 *
 * Performs one database query.
 */
export async function teamMemberList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  logger.debug('%s: %s: listing team members', user.username, team.slug)

  // return result from cache in case it is available

  const cacheKey = `route_teamMemberList_${team.slug}`

  if (await redisClient.isCached(cacheKey)) {
    logger.debug('%s: from cache', cacheKey)
    const cached = await redisClient.getCached(cacheKey)
    return res.status(200).json(cached)
  }

  // perform database lookup

  const output = await teamMemberListImpl(team)

  // cache the result and return as output

  redisClient.cache(cacheKey, output)
  return res.status(200).json(output)
}
