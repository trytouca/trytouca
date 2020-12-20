/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { comparisonRemove } from './comparison'
import { BatchModel } from '../schemas/batch'
import { ComparisonModel } from '../schemas/comparison'
import { ElementModel } from '../schemas/element'
import { MessageModel } from '../schemas/message'
import { MessageInfo } from './messageInfo'
import * as elastic from '../utils/elastic'
import { filestore } from '../utils/filestore'
import logger from '../utils/logger'

/**
 *
 */
export async function messageRemove(msgInfo: MessageInfo): Promise<boolean> {

  const tuple = msgInfo.name()
  logger.silly('%s: attempting to remove message', tuple)

  try {

    // if a message has comparison jobs that are either waiting to be
    // compared or are in process of being compared by the comparator,
    // it is not appropriate to remove those jobs. since comparison jobs
    // are processed asyncroneously, we cannot estimate when they are
    // processed either. Hence, we leave it to the next scheduled
    // execution of this operation to deal with those pending jobs.

    // for comparison results that are already processed, we proceed to
    // removing them from elasticsearch and mongodb.

    const jobs = await ComparisonModel.find({
      $or: [
        { dstMessageId: msgInfo.messageId },
        { srcMessageId: msgInfo.messageId }
      ],
      processedAt: { $exists: true }
    }, { _id: 1, elasticId: 1 })

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

    // remove message from elastic database

    await elastic.removeResult(msgInfo.elasticId)

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
      logger.info('%s: removed element',
        msgInfo.suiteName + '/' + msgInfo.elementName)
    }

    // remove the submission from local filesystem

    await filestore.remove(msgInfo)

    logger.info('%s: removed message', tuple)
    return true

  } catch (err) {
    logger.warn('%s: failed to remove message: %O', tuple, err)
    return false
  }

}
