// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole } from '@touca/api-schema'

import {
  ITeam,
  ITeamDocument,
  IUser,
  TeamModel,
  UserModel
} from '../schemas/index.js'
import { logger } from '../utils/index.js'

/**
 * @summary provides a list of members and admins of a given team.
 *
 * @description
 * Performs a single database query.
 *
 * @param team team whose members should be returned
 * @param role roles of the users within this time to return
 * @returns list of users who are either members or admins of a given team.
 */
export async function findTeamUsersByRole(
  team: ITeam,
  roles: ETeamRole[]
): Promise<IUser[]> {
  const fields = []
  if (roles.includes('owner')) {
    fields.push(['$owner'])
  }
  if (roles.includes('admin')) {
    fields.push('$admins')
  }
  if (roles.includes('member')) {
    fields.push('$members')
  }

  const result: IUser[] = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    { $project: { items: { $concatArrays: fields } } },
    {
      $lookup: {
        from: 'users',
        localField: 'items',
        foreignField: '_id',
        as: 'itemDocs'
      }
    },
    {
      $project: {
        _id: 0,
        'itemDocs._id': 1,
        'itemDocs.email': 1,
        'itemDocs.fullname': 1,
        'itemDocs.platformRole': 1,
        'itemDocs.username': 1
      }
    },
    { $unwind: '$itemDocs' },
    { $replaceRoot: { newRoot: '$itemDocs' } }
  ])
  return result
}

/**
 * @summary
 * Finds role of a user in a given team.
 *
 * @description
 * Performs a single database query.
 *
 * @return role of the user in a given team. `ETeamRole.Invalid` if user is
 * not a member of the team.
 */
export async function findTeamRoleOfUser(
  team: ITeam,
  user: IUser
): Promise<ETeamRole> {
  type DatabaseOutput = { role: ETeamRole }
  const result: DatabaseOutput[] = await TeamModel.aggregate([
    { $match: { _id: team._id } },
    {
      $project: {
        role: {
          $cond: {
            if: { $in: [user._id, '$members'] },
            then: 'member',
            else: {
              $cond: {
                if: { $in: [user._id, '$admins'] },
                then: 'admin',
                else: {
                  $cond: {
                    if: { $eq: [user._id, '$owner'] },
                    then: 'owner',
                    else: 'invalid'
                  }
                }
              }
            }
          }
        }
      }
    }
  ])
  return result[0].role
}

export async function teamCreate(
  user: IUser,
  team: { slug: string; name: string }
): Promise<ITeamDocument> {
  // check that team slug is available

  if (await TeamModel.countDocuments({ slug: team.slug })) {
    return
  }

  // register team in database

  const newTeam = await TeamModel.create({
    name: team.name,
    owner: user._id,
    slug: team.slug
  })
  logger.info('%s: created team %s', user.username, team.slug)

  // update the user document to include a reference to this team

  await UserModel.findByIdAndUpdate(user._id, {
    $push: { teams: newTeam._id }
  })
  return newTeam
}

/**
 * Find a team slug that is not already registered.
 */
export async function generateTeamSlug() {
  const random = () => Math.floor(100000 + Math.random() * 900000)
  let slug = `tutorial-${random()}`
  while (await TeamModel.countDocuments({ slug })) {
    logger.warn('findTeamSlug() implementation may be inefficient')
    slug = `tutorial-${random()}`
  }
  return slug
}
