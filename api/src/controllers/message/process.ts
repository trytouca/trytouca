/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import * as elastic from '../../utils/elastic'
import logger from '../../utils/logger'
import { MessageModel, IMessageDocument } from '../../schemas/message'

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
  // elastic database.

  if (message.elasticId) {
    logger.warn('%s: message already processed', messageId)
    await elastic.removeResult(message.elasticId)
  }

  // insert message in json format into elastic database

  const doc = await elastic.addResult(input.body)
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
      elasticId: doc,
      meta: input.overview
    }
  })

  logger.silly('%s: processed message', messageId)
  return res.status(204).send()
}
