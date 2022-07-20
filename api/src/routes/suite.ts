// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { ctrlSuiteCreate } from '@/controllers/suite/create'
import { ctrlSuiteList } from '@/controllers/suite/list'
import { ctrlSuiteLookup } from '@/controllers/suite/lookup'
import { ctrlSuiteRemove } from '@/controllers/suite/remove'
import { suiteSubscribe } from '@/controllers/suite/subscribe'
import { suiteUpdate } from '@/controllers/suite/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.get(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(ctrlSuiteList, 'list suites')
)

router.post(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name'),
    ev.body('name').exists().withMessage('required'),
    middleware.validationRules.get('entity-slug'),
    ev.body('slug').exists().withMessage('required')
  ]),
  promisable(ctrlSuiteCreate, 'create suite')
)

router.get(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(ctrlSuiteLookup, 'lookup suite')
)

router.patch(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name').optional(),
    middleware.validationRules.get('entity-slug').optional(),
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
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasSuite,
  promisable(ctrlSuiteRemove, 'remove suite')
)

router.patch(
  '/:team/:suite/subscribe',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  express.json(),
  promisable(suiteSubscribe, 'subscribe suite')
)

export { router as suiteRouter }
