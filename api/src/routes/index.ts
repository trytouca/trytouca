// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'
import nocache from 'nocache'

import { feedback } from '@/controllers/misc/feedback'
import * as middleware from '@/middlewares'
import { authRouter } from '@/routes/auth'
import { batchRouter } from '@/routes/batch'
import { clientRouter } from '@/routes/client'
import { commentRouter } from '@/routes/comment'
import { elementRouter } from '@/routes/element'
import { inboxRouter } from '@/routes/inbox'
import { platformRouter } from '@/routes/platform'
import { suiteRouter } from '@/routes/suite'
import { teamRouter } from '@/routes/team'
import { userRouter } from '@/routes/user'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.use(nocache())

router.get('/', (_req, res) => {
  res.redirect(302, '/api/platform')
})

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
router.use('/suite', suiteRouter)
router.use('/team', teamRouter)
router.use('/user', userRouter)

router.post(
  '/feedback',
  express.json(),
  middleware.inputs([
    ev
      .body('body')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 1000 })
      .withMessage('too long')
      .isLength({ min: 20 })
      .withMessage('too short'),
    ev
      .body('name')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 100 })
      .withMessage('too long'),
    ev
      .body('page')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 16 })
      .withMessage('too long')
      .isSlug()
      .withMessage('invalid'),
    ev
      .body('email')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isEmail()
      .withMessage('must be an email')
      .isLength({ max: 100 })
      .withMessage('too long'),
    ev
      .body('cname')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 100 })
      .withMessage('too long')
  ]),
  promisable(feedback, 'handle user feedback')
)

router.use((_req, _res, next) => {
  return next({ status: 404, errors: ['invalid route'] })
})

export { router as default }
