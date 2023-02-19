// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import {
  ctrlSuiteCreate,
  ctrlSuiteList,
  ctrlSuiteLookup,
  ctrlSuiteRemove,
  suiteSubscribe,
  suiteUpdate
} from '../controllers/suite/index.js'
import {
  hasSuite,
  hasTeam,
  isAuthenticated,
  isTeamAdmin,
  isTeamMember,
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { handleEvents } from '../utils/index.js'

const router = express.Router()

router.get(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  standby(ctrlSuiteList, 'list suites')
)

router.post(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  express.json(),
  validationRules([
    validationMap.get('entity-name'),
    ev.body('name').exists().withMessage('required'),
    validationMap.get('entity-slug'),
    ev.body('slug').exists().withMessage('required')
  ]),
  standby(ctrlSuiteCreate, 'create suite')
)

router.get(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  standby(ctrlSuiteLookup, 'lookup suite')
)

router.patch(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  express.json(),
  validationRules([
    validationMap.get('entity-name').optional(),
    validationMap.get('entity-slug').optional(),
    ev
      .body('retainFor')
      .isInt({ min: 86400, max: 63115200 })
      .withMessage('not a number')
      .withMessage('invalid')
      .optional(),
    ev
      .body('sealAfter')
      .isInt({ min: 120, max: 1800 })
      .withMessage('not a number')
      .withMessage('invalid')
      .optional()
  ]),
  standby(suiteUpdate, 'update suite')
)

router.delete(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasSuite,
  standby(ctrlSuiteRemove, 'remove suite')
)

router.get(
  '/:team/:suite/events',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  handleEvents
)

router.patch(
  '/:team/:suite/subscribe',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  express.json(),
  standby(suiteSubscribe, 'subscribe suite')
)

export { router as suiteRouter }
