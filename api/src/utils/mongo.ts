// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

import { configMgr } from './config.js'
import { logger } from './logger.js'

export async function makeConnectionMongo(): Promise<boolean> {
  mongoose.Promise = Promise
  const mongo_uri = configMgr.getMongoUri()
  const mongo_options = configMgr.getMongoConnectionOptions()
  logger.silly('connecting to %s with options %j', mongo_uri, mongo_options)
  await mongoose.connect(mongo_uri, mongo_options)
  mongoose.connection.on('disconnected', () => {
    logger.debug('closed database connection')
  })
  return true
}

export async function shutdownMongo() {
  logger.info('disconnecting from mongoose')
  await mongoose.disconnect()
}
