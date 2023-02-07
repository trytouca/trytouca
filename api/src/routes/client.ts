// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { json, raw, Router } from 'express'
import * as ev from 'express-validator'

import {
  clientBatchSeal,
  clientOptions,
  clientSessionCreate,
  clientSubmit,
  clientSubmitArtifact,
  clientVerify
} from '../controllers/client/index.js'
import {
  hasBatch,
  hasSuite,
  hasTeam,
  isClientAuthenticated,
  isTeamMember,
  standby,
  validationRules
} from '../middlewares/index.js'

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
  standby(clientSessionCreate, 'create client session')
)

router.post(
  '/seal/:team/:suite/:batch',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(clientBatchSeal, 'seal a batch')
)

router.post(
  '/options',
  isClientAuthenticated,
  json(),
  standby(clientOptions, 'fetch workflow options')
)

router.post(
  '/submit',
  isClientAuthenticated,
  raw({ limit: '50mb' }),
  standby(clientSubmit, 'handle submitted result')
)

router.post(
  '/submit/artifact/:team/:suite/:batch/:element/:key',
  isClientAuthenticated,
  raw({ limit: '50mb' }),
  standby(clientSubmitArtifact, 'handle submitted artifact')
)

router.post('/verify', standby(clientVerify, 'verify configuration options'))

export { router as clientRouter }
