// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import {
  ctrlUserDelete,
  userLookup,
  userSessionDelete,
  userSessions,
  userUpdate
} from '../controllers/user/index.js'
import {
  isAuthenticated,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

const router = express.Router()

router.get(
  '/',
  isAuthenticated,
  promisable(userLookup, 'lookup user information')
)

router.patch(
  '/',
  isAuthenticated,
  express.json(),
  validationRules([
    validationMap.get('fullname').optional(),
    validationMap.get('username').optional(),
    validationMap.get('password').optional()
  ]),
  promisable(userUpdate, 'update user')
)

router.delete(
  '/',
  isAuthenticated,
  promisable(ctrlUserDelete, 'delete own account')
)

router.get(
  '/sessions',
  isAuthenticated,
  promisable(userSessions, 'list active sessions')
)

router.delete(
  '/sessions/:id',
  isAuthenticated,
  promisable(userSessionDelete, 'expire active session')
)

export { router as userRouter }
