// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'node:fs'

import { pick } from 'lodash'

import { ComparisonJob } from '@/models/comparison'
import { wslFindByUname, wslGetSuperUser } from '@/models/user'
import { comparisonQueue, messageQueue } from '@/queues'
import { ComparisonModel } from '@/schemas/comparison'
import { MessageModel } from '@/schemas/message'
import { MetaModel } from '@/schemas/meta'
import { UserModel } from '@/schemas/user'
import { config, configMgr } from '@/utils/config'
import logger from '@/utils/logger'
import { objectStore } from '@/utils/store'

/**
 * Registers primary user during server startup.
 * Defining such user helps send notifications to other users
 * on behalf of the platform.
 */
export async function setupSuperuser() {
  // check if user is already registered in the database

  const user = await wslGetSuperUser()
  if (user) {
    return user._id
  }

  // otherwise register the user in the database

  const superuser = await UserModel.create({
    email: 'noreply@touca.io',
    fullname: 'Touca',
    password: 'supersafehash',
    platformRole: 'super',
    username: 'touca'
  })

  logger.info('startup stage: created superuser')
  return superuser._id
}

/**
 * Register a special "anonymous" user during server startup.
 * When a user removes their account, their activities such as their comments,
 * promotions, submissions etc will be assigned to this special user account.
 */
export async function setupAnonymousUser() {
  // check if user is already registered in the database

  const user = await wslFindByUname('anonymous')
  if (user) {
    return user._id
  }

  // otherwise register the user in the database

  const anonymousUser = await UserModel.create({
    email: 'anonymous@touca.io',
    fullname: 'Former User',
    password: 'supersafehash',
    platformRole: 'user',
    username: 'anonymous'
  })

  logger.info('startup stage: created anonymous user')
  return anonymousUser._id
}

// In August 2022, we added support for setting up a mail server through the
// web app. We plan to phase out support for the environment variables. Until
// then, for an intuitive user experience, we apply the environment variables
// to the database so that they always take precedence.
async function applyMailTransportEnvironmentVariables() {
  if (!configMgr.hasMailTransportEnvironmentVariables()) {
    return
  }
  const mail = pick(config.mail, ['host', 'pass', 'port', 'user'])
  await MetaModel.findOneAndUpdate({}, { $set: { mail } })
  logger.info('updated mail server based on environment variables')
}

export async function upgradeDatabase() {
  logger.info('database migration: performing checks')
  await applyMailTransportEnvironmentVariables()
  await MetaModel.findOneAndUpdate(
    {},
    {
      $unset: {
        cmpAvgCollectionTime: true,
        cmpAvgProcessingTime: true,
        cmpNumCollectionJobs: true,
        cmpNumProcessingJobs: true
      }
    }
  )
  const update = { $unset: { reservedAt: true } }
  await ComparisonModel.findOneAndUpdate({}, update)
  await MessageModel.findOneAndUpdate({}, update)
  await objectStore.upgradeBuckets()
  logger.info('database migration: checks completed')
  return true
}

export async function statusReport() {
  if (config.isCloudHosted) {
    logger.info('running in cloud-hosted mode')
  }
  if (!config.samples.enabled) {
    logger.warn('sample data submission is disabled')
  }
  if (!configMgr.hasMailTransport()) {
    logger.warn('mail server not configured')
  }
  if (!fs.existsSync(config.samples.directory)) {
    logger.warn('samples directory not found at %s', config.samples.directory)
  }
  return true
}

export async function loadComparisonQueue() {
  const queryOutput = await ComparisonModel.aggregate([
    {
      $match: {
        processedAt: { $exists: false },
        contentId: { $exists: false }
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'dstMessageId',
        foreignField: '_id',
        as: 'dstMessage'
      }
    },
    {
      $lookup: {
        from: 'messages',
        localField: 'srcMessageId',
        foreignField: '_id',
        as: 'srcMessage'
      }
    },
    {
      $project: {
        dstId: { $arrayElemAt: ['$dstMessage', 0] },
        srcId: { $arrayElemAt: ['$srcMessage', 0] }
      }
    },
    {
      $project: {
        _id: 0,
        jobId: '$_id',
        dstBatchId: '$dstId.batchId',
        dstContentId: '$dstId.contentId',
        dstMessageId: '$dstId._id',
        srcContentId: '$srcId.contentId',
        srcBatchId: '$srcId.batchId',
        srcMessageId: '$srcId._id'
      }
    }
  ])
  const jobs: ComparisonJob[] = queryOutput.map((v) => ({
    jobId: v.jobId,
    dstBatchId: v.dstBatchId,
    dstMessageId: v.dstMessageId,
    srcBatchId: v.srcBatchId,
    srcMessageId: v.srcMessageId
  }))
  if (jobs.length === 0) {
    return
  }
  logger.debug('inserting %d jobs into comparisons queue', jobs.length)
  await comparisonQueue.queue.addBulk(
    jobs.map((job) => ({
      name: job.jobId.toHexString(),
      data: job,
      opts: {
        jobId: job.jobId.toHexString()
      }
    }))
  )
}

export async function loadMessageQueue() {
  const jobs = await MessageModel.aggregate([
    { $match: { contentId: { $exists: false } } },
    { $project: { _id: 0, messageId: '$_id', batchId: 1 } }
  ])
  if (jobs.length === 0) {
    return
  }
  logger.debug('inserting %d jobs into message queue', jobs.length)
  await messageQueue.queue.addBulk(
    jobs.map((job) => ({
      name: job.messageId.toHexString(),
      data: job,
      opts: {
        jobId: job.messageId.toHexString()
      }
    }))
  )
}
