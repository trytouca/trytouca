// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import express from 'express'
import * as ev from 'express-validator'

import { platformAccountDelete } from '@/controllers/platform/accountDelete'
import { platformAccountPopulate } from '@/controllers/platform/accountPopulate'
import { platformAccountSuspend } from '@/controllers/platform/accountSuspend'
import { platformAccountUpdate } from '@/controllers/platform/accountUpdate'
import { platformConfig } from '@/controllers/platform/config'
import { platformHealth } from '@/controllers/platform/health'
import { platformInstall } from '@/controllers/platform/install'
import { platformStats } from '@/controllers/platform/stats'
import { platformUpdate } from '@/controllers/platform/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

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
  '/account/:account/populate',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  promisable(platformAccountPopulate, 'populate account with sample data')
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
