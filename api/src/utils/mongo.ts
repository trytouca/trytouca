// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

import { configMgr } from '@/utils/config'
import logger from '@/utils/logger'

/**
 *
 */
export async function makeConnectionMongo(): Promise<boolean> {
  mongoose.Promise = Promise
  await mongoose.connect(configMgr.getMongoUri(), {
    autoIndex: false,
    useCreateIndex: true,
    useFindAndModify: false, // use findOneAndUpdate instead
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  mongoose.connection.on('disconnected', () => {
    logger.debug('closed database connection')
  })
  return true
}

export async function shutdownMongo() {
  logger.info('disconnecting from mongoose')
  await mongoose.disconnect()
}
