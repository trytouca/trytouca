// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
// to be removed as part of "Synchronized Comparison" project

import express from 'express'
import { body as vbody, param as vparam } from 'express-validator'

import { comparisonList } from '@/controllers/comparison/list'
import { comparisonProcessCtrl } from '@/controllers/comparison/process'
import { comparisonStats } from '@/controllers/comparison/stats'
import { messageProcessCtrl } from '@/controllers/message/process'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.get('/', promisable(comparisonList, 'list comparison jobs'))

router.patch(
  '/job/:job',
  middleware.inputs([vparam('job').isMongoId().withMessage('job invalid')]),
  express.json({ limit: '10mb' }),
  promisable(comparisonProcessCtrl, 'process comparison job')
)

router.patch(
  '/message/:message',
  middleware.inputs([vparam('message').isMongoId().withMessage('job invalid')]),
  express.json({ limit: '10mb' }),
  promisable(messageProcessCtrl, 'process message')
)

router.post(
  '/stats',
  express.json(),
  middleware.inputs(
    [
      'avgCollectionTime',
      'avgProcessingTime',
      'numCollectionJobs',
      'numProcessingJobs'
    ].map((key) =>
      vbody(key)
        .exists()
        .withMessage('required')
        .isNumeric()
        .withMessage('must be a number')
    )
  ),
  promisable(comparisonStats, 'comparison stats')
)

export { router as comparisonRouter }
