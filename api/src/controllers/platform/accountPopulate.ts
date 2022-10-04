// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { addSampleData } from '@/models/sampleData'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'

export async function platformAccountPopulate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  logger.debug(
    '%s: populating account %s with sample data',
    user.username,
    account.username
  )

  await addSampleData(account, team)

  logger.info(
    '%s: populate account %s with sample data',
    user.username,
    account.username
  )

  return res.status(204).send()
}
