// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import nocache from 'nocache'

import { platformHealth } from '@/controllers/platform'
import { feedbackSubmit } from '@/controllers/relay/feedback'
import { authRouter } from '@/routes/auth'
import { batchRouter } from '@/routes/batch'
import { clientRouter } from '@/routes/client'
import { commentRouter } from '@/routes/comment'
import { elementRouter } from '@/routes/element'
import { inboxRouter } from '@/routes/inbox'
import { platformRouter } from '@/routes/platform'
import { relayRouter } from '@/routes/relay'
import { suiteRouter } from '@/routes/suite'
import { teamRouter } from '@/routes/team'
import { userRouter } from '@/routes/user'
import { config } from '@/utils/config'
import { promisable } from '@/utils/routing'

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
