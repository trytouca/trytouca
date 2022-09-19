// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { clientBatchNext } from '@/controllers/client/batchNext'
import { clientElementList } from '@/controllers/client/elementList'
import { clientSessionCreate } from '@/controllers/client/sessionCreate'
import { clientSubmit } from '@/controllers/client/submit'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.post(
  '/signin',
  express.json(),
  middleware.inputs([
    ev
      .body('key')
      .exists()
      .withMessage('required')
      .isUUID()
      .withMessage('invalid')
  ]),
  promisable(clientSessionCreate, 'create client session')
)

router.get(
  '/element/:team/:suite',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(clientElementList, 'list suite elements')
)

router.get(
  '/batch/:team/:suite/next',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(clientBatchNext, 'show next batch')
)

router.post(
  '/submit',
  middleware.isClientAuthenticated,
  express.raw({ limit: '50mb' }),
  promisable(clientSubmit, 'handle submitted result')
)

export { router as clientRouter }
