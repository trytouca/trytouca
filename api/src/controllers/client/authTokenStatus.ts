// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Request, Response } from 'express'

import { redisClient } from '../../utils/index.js'

type ReqParams = {
  token?: string
}

type ResBody =
  | { status: 'invalid' }
  | { status: 'unverified' }
  | {
      status: 'verified'
      apiKey: string
    }

export async function clientAuthTokenStatus(
  req: Request<ReqParams>,
  res: Response<ResBody>
) {
  const apiKey = await redisClient.get(`client_auth_token:${req.params.token}`)

  if (apiKey == null) {
    return res.send({ status: 'invalid' })
  }

  if (apiKey == '') {
    return res.send({ status: 'unverified' })
  }

  res.send({ status: 'verified', apiKey })
}
