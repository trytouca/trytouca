// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import nocache from 'nocache'

import { platformHealth } from '../controllers/platform/index.js'
import { feedbackSubmit } from '../controllers/relay/feedback.js'
import { config, promisable } from '../utils/index.js'
import { authRouter } from './auth.js'
import { batchRouter } from './batch.js'
import { clientRouter } from './client.js'
import { commentRouter } from './comment.js'
import { elementRouter } from './element.js'
import { inboxRouter } from './inbox.js'
import { platformRouter } from './platform.js'
import { relayRouter } from './relay.js'
import { suiteRouter } from './suite.js'
import { teamRouter } from './team.js'
import { userRouter } from './user.js'

const router = express.Router()

router.use(nocache())

router.get(
  '/',
  config.isCloudHosted
    ? promisable(platformHealth, 'check platform health')
    : (_req, res) => res.redirect(302, '/api/platform')
)

router.get('/@/:team/:suite', (_req, res) => {
  res.redirect(308, 'https://touca.io/docs')
})

router.use('/auth', authRouter)
router.use('/batch', batchRouter)
router.use('/client', clientRouter)
router.use('/comment', commentRouter)
router.use('/element', elementRouter)
router.use('/inbox', inboxRouter)
router.use('/platform', platformRouter)
router.use('/relay', relayRouter)
router.use('/suite', suiteRouter)
router.use('/team', teamRouter)
router.use('/user', userRouter)

router.post(
  '/feedback',
  express.json(),
  promisable(feedbackSubmit, 'handle user feedback')
)

router.use((req, _res, next) => {
  return next({ status: 404, errors: ['invalid route'], url: req.originalUrl })
})

export { router as default }
