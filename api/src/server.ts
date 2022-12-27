// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import compression from 'compression'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import hidePoweredBy from 'hide-powered-by'
import { Server } from 'http'

import router from './routes/index.js'
import { runShutdownSequence, runStartupSequence } from './startup/index.js'
import { config, logger } from './utils/index.js'

function registerMiddlewares(app: express.Express) {
  app.use(cors({ origin: true, credentials: true }))
  app.use(cookieParser(config.auth.cookieSecret))
  app.use(hidePoweredBy())
  app.use(compression())

  if (config.isCloudHosted) {
    app.enable('trust proxy')
    app.use('/', router)
  } else {
    app.use('/api', router)
    app.use(
      express.static(config.webapp.distDirectory, {
        maxAge: '1d',
        setHeaders: (res, path) => {
          if (express.static.mime.lookup(path) === 'text/html') {
            res.setHeader('Cache-Control', 'public, max-age=0')
          }
        }
      })
    )
    app.get('*', (_req, res) => {
      res.sendFile(`${config.webapp.distDirectory}/index.html`)
    })
  }

  app.use((err, req, res, next) => {
    const level = (err.status || 500) === 500 ? 'error' : 'warn'
    logger.log(level, '%j', err)
    res.status(err.status || 500).json({ errors: err.errors })
  })
}

let server: Server = undefined

;['SIGUSR2', 'SIGINT'].forEach((sig) => {
  process.once(sig, async () => {
    logger.warn('received signal %s', sig)
    try {
      logger.debug('shutdown process started')
      runShutdownSequence()
      server?.close()
      logger.info('shutdown process completed')
    } catch (err) {
      logger.warn('backend failed to shutdown gracefully: %O', err)
    } finally {
      process.exit(1)
    }
  })
})

const app = express()
registerMiddlewares(app)
await runStartupSequence()
server = app.listen(config.express.port, () => {
  logger.info('listening on port %d', config.express.port)
})
