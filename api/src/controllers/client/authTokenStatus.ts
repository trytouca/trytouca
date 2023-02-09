// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Request, Response } from 'express'

import { redisClient } from '../../utils/index.js'

interface ReqParams {
  token?: string
}

interface ResBodySuccessInvalid {
  status: 'invalid'
}

interface ResBodySuccessUnverified {
  status: 'unverified'
}

interface ResBodySuccessVerified {
  status: 'verified'
  apiKey: string
}

type ResBody =
  | ResBodySuccessUnverified
  | ResBodySuccessVerified
  | ResBodySuccessInvalid

export async function clientAuthTokenStatus(
  req: Request<ReqParams, {}, {}, {}, {}>,
  res: Response<ResBody, {}>
) {
  const result = await redisClient.clientAuthTokenRead(req.params.token)

  res.status(200).send(result)
}
