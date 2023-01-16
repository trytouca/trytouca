// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash-es'

import {
  BatchModel,
  ElementModel,
  IUser,
  MessageModel,
  SuiteModel,
  TeamModel
} from '../../schemas/index.js'
import { logger } from '../../utils/index.js'
import { objectStore } from '../../utils/store.js'

type Meta = Record<'team' | 'suite' | 'batch' | 'element' | 'key', string>

async function processArtifact(
  user: IUser,
  meta: Meta,
  content: Uint8Array
): Promise<string[]> {
  const team = await TeamModel.findOne({ slug: meta.team })
  const suite = await SuiteModel.findOne({ team: team._id, slug: meta.suite })
  const batch = await BatchModel.findOne({ suite: suite._id, slug: meta.batch })
  const element = await ElementModel.findOne({
    suiteId: suite._id,
    slug: meta.element
  })
  const message = await MessageModel.findOne({
    batchId: batch._id,
    elementId: element._id
  })
  await objectStore.addArtifact(
    `${message._id}/${meta.key}`,
    Buffer.from(content)
  )
  await MessageModel.findByIdAndUpdate(message._id, {
    $push: { artifacts: { key: meta.key } }
  })
  return []
}

export async function clientSubmitArtifact(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tic = process.hrtime()

  // check that request has the right content-type

  if (req.header('content-type') !== 'application/octet-stream') {
    return next({
      errors: ['expected binary data'],
      status: 501
    })
  }
  logger.debug('%s: received request for artifact submission', user.username)

  const meta = pick(req.params, ['team', 'suite', 'batch', 'element', 'key'])

  const errors = await processArtifact(user, meta, req.body)
  if (errors.length !== 0) {
    logger.warn('%s: failed to handle artifact', user.username)
    errors.forEach((e) => logger.warn(e))
    return res.status(400).json({ errors })
  }

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled artifact in %d ms', user.username, toc.toFixed(0))
  return res.status(204).send()
}
