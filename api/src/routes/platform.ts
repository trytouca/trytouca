// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import express from 'express'
import * as ev from 'express-validator'

import {
  platformAccountDelete,
  platformAccountSuspend,
  platformAccountUpdate,
  platformConfig,
  platformHealth,
  platformInstall,
  platformStats,
  platformUpdate
} from '../controllers/platform/index.js'
import {
  hasAccount,
  hasSuspendedAccount,
  isAuthenticated,
  isPlatformAdmin,
  validationRules
} from '../middlewares/index.js'
import { promisable } from '../utils/index.js'

const router = express.Router()

router.get('/', promisable(platformHealth, 'check platform health'))

router.post(
  '/install',
  express.json(),
  promisable(platformInstall, 'register server')
)

router.get('/config', promisable(platformConfig, 'get platform configuration'))

router.patch(
  '/config',
  express.json(),
  promisable(platformUpdate, 'update platform settings')
)

router.get(
  '/stats',
  isAuthenticated,
  isPlatformAdmin,
  promisable(platformStats, 'get platform statistics')
)

router.patch(
  '/account/:account',
  isAuthenticated,
  isPlatformAdmin,
  hasAccount,
  express.json(),
  validationRules([
    ev
      .body('role')
      .custom(
        (v: EPlatformRole) => v === 'guest' || v === 'user' || v === 'admin'
      )
      .withMessage('invalid')
  ]),
  promisable(platformAccountUpdate, 'update account profile on platform')
)

router.post(
  '/account/:account/suspend',
  isAuthenticated,
  isPlatformAdmin,
  hasAccount,
  promisable(platformAccountSuspend, 'suspend account')
)

router.post(
  '/account/:account/delete',
  isAuthenticated,
  isPlatformAdmin,
  hasSuspendedAccount,
  promisable(platformAccountDelete, 'delete account')
)

export { router as platformRouter }
