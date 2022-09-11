// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'fs'

import { wslFindByUname, wslGetSuperUser } from '@/models/user'
import { ComparisonModel } from '@/schemas/comparison'
import { MessageModel } from '@/schemas/message'
import { MetaModel } from '@/schemas/meta'
import { UserModel } from '@/schemas/user'
import { config, configMgr } from '@/utils/config'
import logger from '@/utils/logger'

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

export async function upgradeDatabase() {
  logger.info('database migration: performing checks')
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
