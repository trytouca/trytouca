// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Request, Response } from 'express'
import { nanoid } from 'nanoid'

import { config, logger, redisClient } from '../../utils/index.js'

export async function clientAuthTokenCreate(req: Request, res: Response) {
  const token = nanoid(16)
  await redisClient.set(`client_auth_token:${token}`, '', 900)
  logger.info('received cli login request: %s', token)
  const webUrl = `${config.webapp.root}/account/signin?t=${token}`
  return res.status(200).json({ token, webUrl })
}
