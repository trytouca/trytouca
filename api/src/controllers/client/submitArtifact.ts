// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { fileTypeFromBuffer } from 'file-type'
import { pick } from 'lodash-es'
import { nanoid } from 'nanoid'

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

async function processArtifact(user: IUser, meta: Meta, content: Uint8Array) {
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
  const fileType = await fileTypeFromBuffer(content)
  const suffix = fileType ? `.${fileType?.ext}` : ''
  const path = `${message._id}/${nanoid()}${suffix}`
  await objectStore.addArtifact(path, Buffer.from(content))
  await MessageModel.findByIdAndUpdate(message._id, {
    $push: {
      artifacts: {
        ext: fileType?.ext,
        key: meta.key,
        mime: fileType?.mime,
        path
      }
    }
  })
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
  try {
    await processArtifact(user, meta, req.body)
  } catch (err) {
    logger.warn('%s: failed to handle artifact: %s', user.username, err)
    return next({ status: 400, errors: [err] })
  }

  const toc = process.hrtime(tic).reduce((sec, nano) => sec * 1e3 + nano * 1e-6)
  logger.info('%s: handled artifact in %d ms', user.username, toc.toFixed(0))
  return res.status(204).send()
}
