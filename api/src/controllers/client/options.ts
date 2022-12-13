// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { batchNext, elementListBaseline } from '../../models/index.js'
import {
  BatchModel,
  IUser,
  SuiteModel,
  TeamModel
} from '../../schemas/index.js'
import { logger } from '../../utils/index.js'

type Workflow = {
  suite: string
  team: string
  version?: string
  testcases?: Array<string>
}

async function findOptions(
  workflow: Workflow,
  user: IUser
): Promise<Workflow & { error?: string }> {
  const team = await TeamModel.findOne(
    {
      slug: workflow.team,
      suspended: false,
      $or: [
        { members: { $in: user._id } },
        { admins: { $in: user._id } },
        { owner: user._id }
      ]
    },
    { _id: 1 }
  )
  if (!team) {
    return {
      suite: workflow.suite,
      team: workflow.team,
      error: 'team not found'
    }
  }
  const suite = await SuiteModel.findOne({
    slug: workflow.suite,
    team: team._id
  })
  if (!suite) {
    return {
      suite: workflow.suite,
      team: workflow.team,
      testcases: workflow.testcases,
      version: workflow.version ?? 'v1.0'
    }
  }
  if (
    workflow.version &&
    (await BatchModel.countDocuments({
      suite: suite._id,
      slug: workflow.version,
      sealedAt: { $exists: true }
    }))
  ) {
    return {
      suite: workflow.suite,
      team: workflow.team,
      error: 'batch sealed'
    }
  }
  return {
    suite: workflow.suite,
    team: workflow.team,
    version: workflow.version ?? (await batchNext(suite._id)),
    testcases:
      workflow.testcases?.length !== 0
        ? workflow.testcases
        : (await elementListBaseline(suite)).map((v) => v.slug)
  }
}

export async function clientOptions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tic = process.hrtime()
  const output = await Promise.all(req.body.map((v) => findOptions(v, user)))
  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: returning options in %d ms', user.username, toc.toFixed(0))
  return res.status(output.some((v) => v.error) ? 404 : 200).json(output)
}
