// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import {
  clientBatchNext,
  clientElementList,
  clientSessionCreate,
  clientSubmit,
  clientSubmitArtifact
} from '../controllers/client/index.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

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

router.post(
  '/submit/artifact/:team/:suite/:batch/:element/:key',
  middleware.isClientAuthenticated,
  express.raw({ limit: '50mb' }),
  promisable(clientSubmitArtifact, 'handle submitted artifact')
)

export { router as clientRouter }
