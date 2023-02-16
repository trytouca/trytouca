// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { redisClient } from '../../utils/index.js'

export async function clientAuthTokenStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.params.token
  const data = await redisClient.get(`client_auth_token:${token}`)
  if (data === null) {
    return next({ status: 404, errors: ['token not found', token] })
  }
  return data === ''
    ? res.status(204).send()
    : res.status(200).json(JSON.parse(data))
}
