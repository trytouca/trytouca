// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { ctrlUserDelete } from '@/controllers/user/delete'
import { userLookup } from '@/controllers/user/lookup'
import { userSessionDelete } from '@/controllers/user/sessionDelete'
import { userSessions } from '@/controllers/user/sessions'
import { userUpdate } from '@/controllers/user/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.get(
  '/',
  middleware.isAuthenticated,
  promisable(userLookup, 'lookup user information')
)

router.patch(
  '/',
  middleware.isAuthenticated,
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('fullname').optional(),
    middleware.validationRules.get('username').optional(),
    middleware.validationRules.get('password').optional()
  ]),
  promisable(userUpdate, 'update user')
)

router.delete(
  '/',
  middleware.isAuthenticated,
  promisable(ctrlUserDelete, 'delete own account')
)

router.get(
  '/sessions',
  middleware.isAuthenticated,
  promisable(userSessions, 'list active sessions')
)

router.delete(
  '/sessions/:id',
  middleware.isAuthenticated,
  promisable(userSessionDelete, 'expire active session')
)

export { router as userRouter }
