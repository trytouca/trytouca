/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'
import { configMgr } from './config'
import logger from './logger'

/**
 * attempt to connect to database server.
 *
 * @returns {Promise<boolean>} true if connection is successfully
 */
export async function makeConnectionMongo(): Promise<boolean> {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  mongoose.Promise = Promise

  // If connection fails, periodically attempt to connect again every
  // `kTimeout` milliseconds for as many as `kMaxAttempts` times until
  // the connection is successful.

  // maximum number of times to attempt to connect to server
  const kMaxAttempts = 12
  // maximum amount of time (ms) to between attempts to connect to server
  const kTimeout = 5000

  for (let i = 1; i <= kMaxAttempts; i++) {
    try {
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
      logger.info('succesfully connected to database')
      return true
    } catch (err) {
      logger.warn('failed to connect to database (%d/%d)', i, kMaxAttempts)
      await delay(kTimeout)
    }
  }

  // if we failed to connect after exhausting all of our attempts
  // assume that the database is down or has a fatal startup failure
  // in which case we cannot continue.

  logger.error('exhausted attempts to connect to database')
  return false
}
