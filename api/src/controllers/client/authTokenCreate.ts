// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { webcrypto } from 'node:crypto'

import { Request, Response } from 'express'

import { config, redisClient } from '../../utils/index.js'

interface ResBody {
  token: string
  url: string
}

export async function clientAuthTokenCreate(
  req: Request,
  res: Response<ResBody>
) {
  const token = webcrypto.randomUUID()
  const url = `${config.webapp.root}?token=${token}`

  await redisClient.clientAuthTokenCreate(token, 900)

  res.status(200).send({ token, url })
}
