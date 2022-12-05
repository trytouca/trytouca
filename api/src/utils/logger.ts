// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createLogger,
  format,
  transport as winstonTransport,
  transports as winstonTransports
} from 'winston'

import { config } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const transports: winstonTransport[] = [
  new winstonTransports.Console({
    format: config.isCloudHosted
      ? format.json()
      : format.combine(format.colorize(), format.simple()),
    handleExceptions: true,
    level: config.logging.level
  })
]

if (config.logging.directory) {
  const logDir = normalize(`${__dirname}/../../../${config.logging.directory}`)
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true })
  }
  const fileTransport = new winstonTransports.File({
    filename: join(logDir, 'touca.log'),
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.logstash()
    ),
    handleExceptions: true,
    level: config.logging.level,
    maxFiles: 10,
    maxsize: 1000000
  })
  transports.push(fileTransport)
}

export const logger = createLogger({
  exitOnError: false,
  format: format.splat(),
  transports
})
