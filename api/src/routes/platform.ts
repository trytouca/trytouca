// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import express from 'express'
import * as ev from 'express-validator'

import { platformAccountDelete } from '../controllers/platform/accountDelete.js'
import { platformAccountSuspend } from '../controllers/platform/accountSuspend.js'
import { platformAccountUpdate } from '../controllers/platform/accountUpdate.js'
import { platformConfig } from '../controllers/platform/config.js'
import { platformHealth } from '../controllers/platform/health.js'
import { platformInstall } from '../controllers/platform/install.js'
import { platformStats } from '../controllers/platform/stats.js'
import { platformUpdate } from '../controllers/platform/update.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

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
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  promisable(platformStats, 'get platform statistics')
)

router.patch(
  '/account/:account',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  express.json(),
  middleware.inputs([
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
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  promisable(platformAccountSuspend, 'suspend account')
)

router.post(
  '/account/:account/delete',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasSuspendedAccount,
  promisable(platformAccountDelete, 'delete account')
)

export { router as platformRouter }
