// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { json, raw, Router } from 'express'
import * as ev from 'express-validator'

import { ctrlBatchSeal } from '../controllers/batch/seal.js'
import {
  clientAuthTokenCreate,
  clientAuthTokenStatus,
  clientAuthTokenVerify,
  clientBatchNext,
  clientElementList,
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
  isAuthenticated,
  isClientAuthenticated,
  isTeamMember,
  standby,
  validationRules
} from '../middlewares/index.js'

const router = Router()

router.post('/auth', standby(clientAuthTokenCreate, 'create client auth token'))

router.get(
  '/auth/:token',
  standby(clientAuthTokenStatus, 'show client auth token status')
)

router.patch(
  '/auth/:token',
  isAuthenticated,
  standby(clientAuthTokenVerify, 'verify client auth token')
)

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

/**
 * Deprecated in favor of `/client/options`.
 * Kept for backward compatibility.
 */
router.get(
  '/element/:team/:suite',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  standby(clientElementList, 'list suite elements')
)

/**
 * Deprecated in favor of `/client/options`.
 * Kept for backward compatibility.
 */
router.get(
  '/batch/:team/:suite/next',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  standby(clientBatchNext, 'show next batch')
)

/**
 * Deprecated in favor of `/batch/:team/:suite/:batch/seal`.
 * Only used in Python SDK v1.8.6 (released in Feb 2023).
 * Kept for backward compatibility.
 */
router.post(
  '/seal/:team/:suite/:batch',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchSeal, 'seal a batch')
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
