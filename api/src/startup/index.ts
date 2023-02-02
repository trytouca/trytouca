// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { existsSync } from 'node:fs'

import { pick } from 'lodash-es'
import mongoose from 'mongoose'

import { ComparisonJob, wslGetSuperUser } from '../models/index.js'
import { comparisonQueue, eventsQueue, messageQueue } from '../queues/index.js'
import {
  ComparisonModel,
  MessageModel,
  MetaModel,
  UserModel
} from '../schemas/index.js'
import {
  analyticsService,
  autosealService,
  reportingService,
  retentionService,
  telemetryService
} from '../services/index.js'
import {
  config,
  hasMailTransport,
  hasMailTransportEnvironmentVariables,
  logger,
  objectStore,
  redisClient
} from '../utils/index.js'

/**
 * Registers a special user account, if it does not already exist, for
 * sending notifications to other users on behalf of the server.
 */
async function setupSuperuser() {
  const user = await wslGetSuperUser()
  if (user) {
    return user._id
  }
  const superuser = await UserModel.create({
    email: 'noreply@touca.io',
    fullname: 'Touca',
    password: 'super_safe_hash',
    platformRole: 'super',
    username: 'touca'
  })
  logger.info('startup stage: created superuser')
  return superuser._id
}

/**
 * In August 2022, we added support for setting up a mail server through the
 * web app. We plan to phase out support for the environment variables. Until
 * then, for an intuitive user experience, we apply the environment variables
 * to the database so that they always take precedence.
 */
async function applyMailTransportEnvironmentVariables() {
  if (!hasMailTransportEnvironmentVariables()) {
    return
  }
  const mail = pick(config.mail, ['host', 'pass', 'port', 'user'])
  await MetaModel.findOneAndUpdate({}, { $set: { mail } })
  logger.info('updated mail server based on environment variables')
}

async function upgradeDatabase() {
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

async function statusReport() {
  if (config.isCloudHosted) {
    logger.info('running in cloud-hosted mode')
  }
  if (!config.samples.enabled) {
    logger.warn('sample data submission is disabled')
  }
  if (!hasMailTransport()) {
    logger.warn('mail server not configured')
  }
  if (!existsSync(config.samples.directory)) {
    logger.warn('samples directory not found at %s', config.samples.directory)
  }
  return true
}

async function loadComparisonQueue() {
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

async function loadMessageQueue() {
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

/**
 * Connects to a given server while handling failures.
 *
 * If connection fails, periodically attempt to connect again every
 * `timeout` milliseconds for as many as `maxAttempts` times until
 * the connection is successful.
 *
 * if we failed to connect after exhausting all of our attempts
 * assume that the container is down or has a fatal startup failure
 * in which case we cannot continue.
 *
 * @param cb callback function with connection logic
 * @param name name of the container to connect to
 * @param maxAttempts maximum number of attempts to connect to server
 * @param timeout maximum time (ms) between attempts to connect to server
 */
export async function connectToServer(
  cb: () => Promise<unknown>,
  name = 'server',
  maxAttempts = 12,
  timeout = 5000
) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      if (await cb()) {
        logger.info('successfully connected to %s', name)
        return true
      }
    } catch (err) {
      logger.debug('error when connecting to %s', name)
    }
    logger.warn('failed to connect to %s (%d/%d)', name, i, maxAttempts)
    const delay = (ms: number) => new Promise((v) => setTimeout(v, ms))
    await delay(timeout)
  }
  logger.error('exhausted attempts to connect to %s', name)
  return false
}

export async function makeConnectionMongo(): Promise<boolean> {
  mongoose.Promise = Promise
  mongoose.set('strictQuery', false)
  const options: mongoose.ConnectOptions = config.mongo.tlsCertificateFile
    ? {
        autoIndex: false,
        retryWrites: false,
        sslValidate: false,
        tls: true,
        tlsCAFile: config.mongo.tlsCertificateFile
      }
    : { autoIndex: false }
  logger.silly('connecting to %s with options %j', config.mongo.uri, options)
  await mongoose.connect(config.mongo.uri, options)
  mongoose.connection.on('disconnected', () => {
    logger.debug('closed database connection')
  })
  return true
}

export async function runStartupSequence() {
  for (const { service, name } of [
    { service: () => objectStore.makeConnection(), name: 'object store' },
    { service: makeConnectionMongo, name: 'database' },
    { service: () => redisClient.isReady(), name: 'cache server' }
  ]) {
    if (!(await connectToServer(service, name))) {
      process.exit(1)
    }
  }

  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
    logger.info('created meta document with default values')
  }

  comparisonQueue.start()
  eventsQueue.start()
  messageQueue.start()

  if (!(await upgradeDatabase())) {
    logger.warn('failed to perform database migration')
  }
  await loadMessageQueue()
  await loadComparisonQueue()
  await setupSuperuser()
  await statusReport()

  setInterval(analyticsService, config.services.analytics.checkInterval * 1000)
  setInterval(autosealService, config.services.autoseal.checkInterval * 1000)
  setInterval(retentionService, config.services.retention.checkInterval * 1000)
  setInterval(reportingService, config.services.reporting.checkInterval * 1000)
  setInterval(telemetryService, config.services.telemetry.checkInterval * 1000)
}

export async function runShutdownSequence() {
  await comparisonQueue.close()
  await eventsQueue.close()
  await messageQueue.close()
  await redisClient.shutdown()
  await mongoose.disconnect()
}
