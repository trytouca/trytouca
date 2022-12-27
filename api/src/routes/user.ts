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
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'

const router = express.Router()

router.get('/', isAuthenticated, standby(userLookup, 'lookup user information'))

router.patch(
  '/',
  isAuthenticated,
  express.json(),
  validationRules([
    validationMap.get('fullname').optional(),
    validationMap.get('username').optional(),
    validationMap.get('password').optional()
  ]),
  standby(userUpdate, 'update user')
)

router.delete(
  '/',
  isAuthenticated,
  standby(ctrlUserDelete, 'delete own account')
)

router.get(
  '/sessions',
  isAuthenticated,
  standby(userSessions, 'list active sessions')
)

router.delete(
  '/sessions/:id',
  isAuthenticated,
  standby(userSessionDelete, 'expire active session')
)

export { router as userRouter }
