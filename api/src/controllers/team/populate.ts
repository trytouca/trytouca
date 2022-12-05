// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { addSampleData } from '../../models/sampleData.js'
import { SuiteModel } from '../../schemas/suite.js'
import { ITeam } from '../../schemas/team.js'
import { IUser } from '../../schemas/user.js'
import logger from '../../utils/logger.js'

export async function teamPopulate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser

  if (await SuiteModel.countDocuments({ team: team._id })) {
    return next({ errors: ['team is not empty'], status: 409 })
  }

  logger.debug(
    '%s: populating team %s with sample data',
    user.username,
    team.slug
  )

  await addSampleData(team)

  logger.info(
    '%s: populated team %s with sample data',
    user.username,
    team.slug
  )

  return res.status(204).send()
}
