/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'
import { configMgr } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'

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
