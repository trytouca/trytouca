// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import {
  authGoogleSignin,
  authResetKeyApply,
  authResetKeyCheck,
  authResetKeyCreate,
  authResetKeyResend,
  authSessionCreate,
  authSessionExtend,
  authSessionRemove,
  authVerifyActivate,
  authVerifyCreate,
  authVerifyResend
} from '../controllers/auth/index.js'
import {
  isAuthenticated,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { promisable } from '../utils/index.js'

const router = express.Router()

router.post(
  '/signup',
  express.json(),
  validationRules([validationMap.get('email')]),
  promisable(authVerifyCreate, 'create user account')
)

router.post(
  '/signup/resend',
  express.json(),
  validationRules([validationMap.get('email')]),
  promisable(authVerifyResend, 'resend verification email')
)

router.post(
  '/activate/:key',
  promisable(authVerifyActivate, 'activate user account')
)

router.post(
  '/signin',
  express.json(),
  validationRules([
    validationMap.get('username'),
    validationMap.get('password')
  ]),
  promisable(authSessionCreate, 'create session')
)

router.post(
  '/signin/google',
  express.json(),
  validationRules([validationMap.get('google_token')]),
  promisable(authGoogleSignin, 'create google session')
)

router.post(
  '/signout',
  isAuthenticated,
  promisable(authSessionRemove, 'remove session')
)

router.post(
  '/extend',
  isAuthenticated,
  promisable(authSessionExtend, 'extend session')
)

router.post(
  '/reset',
  express.json(),
  validationRules([validationMap.get('email')]),
  promisable(authResetKeyCreate, 'create password reset key')
)

router.post(
  '/reset/resend',
  express.json(),
  validationRules([validationMap.get('email')]),
  promisable(authResetKeyResend, 'resend password reset key')
)

router.get(
  '/reset/:key',
  validationRules([validationMap.get('resetKey')]),
  promisable(authResetKeyCheck, 'evaluate password reset key')
)

router.post(
  '/reset/:key',
  express.json(),
  validationRules([
    validationMap.get('resetKey'),
    validationMap.get('username'),
    validationMap.get('password')
  ]),
  promisable(authResetKeyApply, 'reset account password')
)

export { router as authRouter }
