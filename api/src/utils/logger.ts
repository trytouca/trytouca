/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import fs from 'fs'
import path from 'path'
import logger from 'winston'

import { config } from '@/utils/config'

// Create the log directory if it does not exist
const logDir = path.normalize(config.logging.directory)
const logFile = path.join(logDir, config.logging.filename)

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

logger.configure({
  exitOnError: false,
  format: logger.format.splat(),
  transports: [
    new logger.transports.File({
      filename: logFile,
      format: logger.format.combine(
        logger.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        logger.format.logstash()
      ),
      handleExceptions: true,
      level: config.logging.level,
      maxFiles: 10,
      maxsize: 1000000
    }),
    new logger.transports.Console({
      format: logger.format.combine(
        logger.format.colorize(),
        logger.format.simple()
      ),
      handleExceptions: true,
      level: config.logging.level
    })
  ]
})

export = logger
