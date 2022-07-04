// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { IMessageDocument, MessageModel } from '@/schemas/message'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

/**
 * @todo validate incoming json data against a json schema
 */
export async function messageProcess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const messageId = req.params.message
  const input = req.body as {
    overview: IMessageDocument['meta']
    body: Record<string, unknown>
  }

  // we expect that message is registered

  const message = await MessageModel.findById(messageId)
  if (!message) {
    return next({
      errors: ['message not found'],
      status: 404
    })
  }

  // if message is already processed, remove its previous content from
  // object storage.

  if (message.contentId) {
    logger.warn('%s: message already processed', messageId)
    await objectStore.removeResult(message._id.toHexString())
  }

  // insert message in json format into object storage

  const doc = await objectStore.addResult(
    message._id.toHexString(),
    JSON.stringify(input.body, null)
  )
  if (!doc) {
    return next({
      errors: ['failed to handle message body'],
      status: 500
    })
  }

  // mark message as processed

  await MessageModel.findByIdAndUpdate(messageId, {
    $set: {
      processedAt: new Date(),
      contentId: message._id,
      meta: input.overview
    },
    $unset: { reservedAt: true }
  })

  logger.silly('%s: processed message', messageId)
  return res.status(204).send()
}
