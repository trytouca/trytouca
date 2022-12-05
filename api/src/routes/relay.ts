// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { feedbackHandle } from '../controllers/relay/feedback.js'
import { installHandle } from '../controllers/relay/install.js'
import { telemetryHandle } from '../controllers/relay/telemetry.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

const router = express.Router()

router.post(
  '/install',
  middleware.isCloudInstance,
  express.json(),
  promisable(installHandle, 'process submitted self-hosted install form')
)

router.post(
  '/telemetry',
  middleware.isCloudInstance,
  express.json(),
  promisable(telemetryHandle, 'process submitted usage report')
)

router.post(
  '/feedback',
  middleware.isCloudInstance,
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
  promisable(feedbackHandle, 'process submitted usage report')
)

export { router as relayRouter }
