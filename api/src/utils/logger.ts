// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { existsSync, mkdirSync } from 'node:fs'
import { join, normalize } from 'node:path'

import { createLogger, format, transports } from 'winston'

import { config } from '../utils/index.js'

// if (config.logging.directory) {
//   const logDir = normalize(`${__dirname}/../../../${config.logging.directory}`)
//   if (!existsSync(logDir)) {
//     mkdirSync(logDir, { recursive: true })
//   }
//   const fileTransport = new transports.File({
//     filename: join(logDir, 'touca.log'),
//     format: format.combine(
//       format.timestamp({
//         format: 'YYYY-MM-DD HH:mm:ss'
//       }),
//       format.logstash()
//     ),
//     handleExceptions: true,
//     level: config.logging.level,
//     maxFiles: 10,
//     maxsize: 1000000
//   })
// }

export const logger = createLogger({
  exitOnError: false,
  format: format.splat(),
  transports: [
    new transports.Console({
      format: config.isCloudHosted
        ? format.json()
        : format.combine(format.colorize(), format.simple()),
      handleExceptions: true,
      level: config.logging.level
    })
  ]
})
