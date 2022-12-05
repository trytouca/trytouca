// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

import { config } from './config.js'
import { logger } from './logger.js'

export async function makeConnectionMongo(): Promise<boolean> {
  mongoose.Promise = Promise
  const mongo_uri = `mongodb://${config.mongo.user}:${config.mongo.pass}@${config.mongo.host}:${config.mongo.port}/${config.mongo.database}`
  const mongo_options = config.mongo.tlsCertificateFile
    ? {
        autoIndex: false,
        retryWrites: false,
        sslValidate: false,
        tls: true,
        tlsCAFile: config.mongo.tlsCertificateFile
      }
    : { autoIndex: false }
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
