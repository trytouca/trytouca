// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

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
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { handleEvents } from '../utils/events.js'
import { promisable } from '../utils/routing.js'

const router = express.Router()

router.get(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(ctrlSuiteList, 'list suites')
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
  promisable(ctrlSuiteCreate, 'create suite')
)

router.get(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  promisable(ctrlSuiteLookup, 'lookup suite')
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
      .isInt({ min: 86400, max: 157680000 })
      .withMessage('not a number')
      .isDivisibleBy(60)
      .withMessage('invalid')
      .optional(),
    ev
      .body('sealAfter')
      .isFloat({ min: 60, max: 86400 })
      .withMessage('not a number')
      .isDivisibleBy(60)
      .withMessage('invalid')
      .optional()
  ]),
  promisable(suiteUpdate, 'update suite')
)

router.delete(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasSuite,
  promisable(ctrlSuiteRemove, 'remove suite')
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
  promisable(suiteSubscribe, 'subscribe suite')
)

export { router as suiteRouter }
