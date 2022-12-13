// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { json, raw, Router } from 'express'
import * as ev from 'express-validator'

import {
  clientBatchNext,
  clientElementList,
  clientOptions,
  clientSessionCreate,
  clientSubmit,
  clientSubmitArtifact
} from '../controllers/client/index.js'
import {
  hasSuite,
  hasTeam,
  isClientAuthenticated,
  isTeamMember,
  validationRules
} from '../middlewares/index.js'
import { promisable } from '../utils/index.js'

const router = Router()

router.post(
  '/signin',
  json(),
  validationRules([
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
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  promisable(clientElementList, 'list suite elements')
)

router.get(
  '/batch/:team/:suite/next',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(clientBatchNext, 'show next batch')
)

router.post(
  '/options',
  isClientAuthenticated,
  json(),
  promisable(clientOptions, 'fetch workflow options')
)

router.post(
  '/submit',
  isClientAuthenticated,
  raw({ limit: '50mb' }),
  promisable(clientSubmit, 'handle submitted result')
)

router.post(
  '/submit/artifact/:team/:suite/:batch/:element/:key',
  isClientAuthenticated,
  raw({ limit: '50mb' }),
  promisable(clientSubmitArtifact, 'handle submitted artifact')
)

export { router as clientRouter }
