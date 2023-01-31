// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { json, raw, Router } from 'express'
import * as ev from 'express-validator'

import {
  clientBatchNext,
  clientElementList,
  clientOptions,
  clientSessionCreate,
  clientSubmit,
  clientSubmitArtifact,
  clientSubmitSync,
  clientVerify
} from '../controllers/client/index.js'
import {
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

router.get(
  '/element/:team/:suite',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  standby(clientElementList, 'list suite elements')
)

router.get(
  '/batch/:team/:suite/next',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  standby(clientBatchNext, 'show next batch')
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

router.post(
  '/submit/sync',
  isClientAuthenticated,
  raw({ limit: '50mb' }),
  standby(clientSubmitSync, 'handle submitted result (sync)')
)

router.post('/verify', standby(clientVerify, 'verify configuration options'))

export { router as clientRouter }
