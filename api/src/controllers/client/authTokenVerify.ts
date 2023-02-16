// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { TeamModel } from 'schemas/team.js'

import { IUser, UserModel } from '../../schemas/user.js'
import { analytics, logger, redisClient } from '../../utils/index.js'

export async function clientAuthTokenVerify(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const token = req.params.token
  logger.debug('verifying cli token: %s', token)
  const value = await redisClient.get(`client_auth_token:${token}`)
  if (value === null) {
    return next({ status: 404, errors: ['token not found'] })
  }
  if (value === '') {
    const { apiKeys, teams } = await UserModel.findById(user._id, {
      apiKeys: 1,
      teams: 1
    })
    const teamSlugs = await TeamModel.find(
      { _id: { $in: teams } },
      { _id: 0, slug: 1 }
    )
    logger.info('cli token verified: %s', token)
    analytics.add_activity('client:login', user, { token })
    await redisClient.set(
      `client_auth_token:${token}`,
      JSON.stringify({
        apiKey: apiKeys[0],
        team: teamSlugs.length ? teamSlugs[0].slug : undefined
      })
    )
  }
  return res.status(204).send()
}
