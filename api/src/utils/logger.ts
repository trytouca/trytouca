// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'fs'
import path from 'path'
import logger from 'winston'

import { config } from '@/utils/config'

const transports: logger.transport[] = [
  new logger.transports.Console({
    format: config.isCloudHosted
      ? logger.format.json()
      : logger.format.combine(logger.format.colorize(), logger.format.simple()),
    handleExceptions: true,
    level: config.logging.level
  })
]

if (config.logging.directory) {
  const logDir = path.normalize(
    `${__dirname}/../../../${config.logging.directory}`
  )
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  const fileTransport = new logger.transports.File({
    filename: path.join(logDir, 'touca.log'),
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
  })
  transports.push(fileTransport)
}

logger.configure({
  exitOnError: false,
  format: logger.format.splat(),
  transports
})

export { logger as default }
