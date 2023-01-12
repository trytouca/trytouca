import { NextFunction, Request, Response } from 'express'

import { TeamModel, UserModel } from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

export async function clientVerify(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const inputApiKey = req.header('x-touca-api-key')

  if (!inputApiKey) {
    logger.debug('client api key not provided')
    return next({
      errors: ['API Key is required.'],
      status: 401
    })
  }

  const user = await UserModel.findOne({
    apiKeys: inputApiKey,
    suspended: false,
    lockedAt: { $exists: false }
  })

  if (!user) {
    logger.debug('%s: client api key is invalid', inputApiKey)
    return next({
      errors: ['API Key is invalid.'],
      status: 401
    })
  }

  logger.info('%s: client verified with api key', user.username)

  const inputTeamSlug = req.query.team

  if (!inputTeamSlug) {
    return res.status(204).end()
  }

  const team = await TeamModel.findOne({
    slug: inputTeamSlug,
    suspended: false
  })

  if (!team) {
    logger.debug('%s: client team does not exist', inputTeamSlug)
    return next({
      errors: [`Team "${inputTeamSlug}" does not exist.`],
      status: 400
    })
  }

  logger.silly(user)

  const isUserPlatformAdmin =
    user.platformRole === 'owner' || user.platformRole === 'admin'

  const isUserTeamMember =
    team.members.includes(user._id) ||
    team.admins.includes(user._id) ||
    team.owner.equals(user._id)

  if (!isUserPlatformAdmin && !isUserTeamMember) {
    logger.debug('%s: client not authorized to access team', inputTeamSlug)
    return next({
      errors: [`User is not authorized to access team "${inputTeamSlug}".`],
      status: 403
    })
  }

  return res.status(204).end()
}
