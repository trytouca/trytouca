// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { TeamModel, UserModel } from '../../schemas/index.js'

export async function clientVerify(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const inputApiKey = req.header('x-touca-api-key')
  if (!inputApiKey) {
    return next({
      errors: ['api key missing'],
      status: 401
    })
  }
  const user = await UserModel.findOne(
    {
      apiKeys: inputApiKey,
      suspended: false,
      lockedAt: { $exists: false }
    },
    { _id: 1, username: 1 }
  )
  if (!user) {
    return next({
      errors: ['api key invalid'],
      status: 401
    })
  }
  const inputTeamSlug = req.body?.team
  if (inputTeamSlug) {
    const hasTeam = await TeamModel.countDocuments({
      slug: inputTeamSlug,
      suspended: false,
      $or: [
        { members: { $in: user._id } },
        { admins: { $in: user._id } },
        { owner: user._id }
      ]
    })
    if (!hasTeam) {
      return next({
        errors: ['team unauthorized'],
        status: 403
      })
    }
  }
  return res.status(204).send()
}
