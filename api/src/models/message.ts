// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { messageQueue } from '../queues/index.js'
import {
  BatchModel,
  ComparisonModel,
  ElementModel,
  MessageModel
} from '../schemas/index.js'
import { MessageOverview, MessageTransformed } from '../types/backendtypes.js'
import { logger, objectStore } from '../utils/index.js'
import { comparisonRemove } from './comparison.js'
import { MessageInfo } from './messageInfo.js'

export async function messageRemove(msgInfo: MessageInfo): Promise<boolean> {
  const tuple = msgInfo.name()
  logger.silly('%s: attempting to remove message', tuple)

  try {
    // if a message has comparison jobs that are either waiting to be
    // compared or are in process of being compared by the comparator,
    // it is not appropriate to remove those jobs. since comparison jobs
    // are processed asynchronously, we cannot estimate when they are
    // processed either. Hence, we leave it to the next scheduled
    // execution of this operation to deal with those pending jobs.

    // for comparison results that are already processed, we proceed to
    // removing them from object storage and mongodb.

    const jobs = await ComparisonModel.find(
      {
        $or: [
          { dstMessageId: msgInfo.messageId },
          { srcMessageId: msgInfo.messageId }
        ],
        processedAt: { $exists: true }
      },
      { _id: 1, contentId: 1 }
    )

    if (jobs.length !== 0) {
      await comparisonRemove(jobs)
    }

    // if any comparison job associated with this message was pending,
    // we declare the removal effort as successful and leave the rest
    // of cleanup to the next scheduled execution of this operation.

    const pendingJobsCount = await ComparisonModel.countDocuments({
      $or: [
        { dstMessageId: msgInfo.messageId },
        { srcMessageId: msgInfo.messageId }
      ],
      processedAt: { $exists: false }
    })

    if (pendingJobsCount !== 0) {
      logger.debug('%s: found pending comparison jobs', tuple)
      return true
    }

    // remove message processing jobs from the queue
    await messageQueue.queue.remove(msgInfo.messageId.toHexString())
    // remove message artifacts from object store
    await Promise.allSettled(
      msgInfo.messageArtifacts.map((name) =>
        objectStore.removeArtifact(msgInfo.messageId.toHexString(), name)
      )
    )
    // remove JSON representation of message from object store
    await objectStore.removeResult(msgInfo.messageId.toHexString())
    // remove message from database
    await MessageModel.findByIdAndRemove(msgInfo.messageId)

    // remove element from this batch

    await BatchModel.findByIdAndUpdate(msgInfo.batchId, {
      $pull: { elements: msgInfo.elementId }
    })

    // if this batch was the only one that included this element,
    // remove the element altogether.

    const batchesWithElement = await BatchModel.countDocuments({
      elements: { $elemMatch: { $eq: msgInfo.elementId } }
    })
    if (batchesWithElement === 0) {
      await ElementModel.findByIdAndRemove(msgInfo.elementId)
      logger.info(
        '%s: removed element',
        msgInfo.suiteName + '/' + msgInfo.elementName
      )
    }

    // remove binary representation of message from object storage

    await objectStore.removeMessage(msgInfo.messageId.toHexString())

    logger.info('%s: removed message', tuple)
    return true
  } catch (err) {
    logger.warn('%s: failed to remove message: %O', tuple, err)
    return false
  }
}

export async function messageProcess(
  messageId: string,
  input: { overview: MessageOverview; body: MessageTransformed }
): Promise<{ status: number; error?: string }> {
  const message = await MessageModel.findById(messageId)
  // we expect that message job exists
  if (!message) {
    return { status: 404, error: 'message not found' }
  }
  // if message is already processed, remove its previous content from
  // object storage.
  if (message.contentId) {
    logger.warn('%s: message already processed', messageId)
    await objectStore.removeResult(message._id.toHexString())
  }
  // insert message result in json format into object storage
  const doc = await objectStore.addResult(
    message._id.toHexString(),
    JSON.stringify(input.body, null)
  )
  if (!doc) {
    return { status: 500, error: 'failed to handle message result' }
  }
  // mark message job as processed
  await MessageModel.findByIdAndUpdate(messageId, {
    $set: {
      processedAt: new Date(),
      contentId: message._id,
      meta: input.overview
    }
  })
  return { status: 204 }
}
