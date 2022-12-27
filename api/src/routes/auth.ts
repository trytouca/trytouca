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
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'

const router = express.Router()

router.post(
  '/signup',
  express.json(),
  validationRules([validationMap.get('email')]),
  standby(authVerifyCreate, 'create user account')
)

router.post(
  '/signup/resend',
  express.json(),
  validationRules([validationMap.get('email')]),
  standby(authVerifyResend, 'resend verification email')
)

router.post(
  '/activate/:key',
  standby(authVerifyActivate, 'activate user account')
)

router.post(
  '/signin',
  express.json(),
  validationRules([
    validationMap.get('username'),
    validationMap.get('password')
  ]),
  standby(authSessionCreate, 'create session')
)

router.post(
  '/signin/google',
  express.json(),
  validationRules([validationMap.get('google_token')]),
  standby(authGoogleSignin, 'create google session')
)

router.post(
  '/signout',
  isAuthenticated,
  standby(authSessionRemove, 'remove session')
)

router.post(
  '/extend',
  isAuthenticated,
  standby(authSessionExtend, 'extend session')
)

router.post(
  '/reset',
  express.json(),
  validationRules([validationMap.get('email')]),
  standby(authResetKeyCreate, 'create password reset key')
)

router.post(
  '/reset/resend',
  express.json(),
  validationRules([validationMap.get('email')]),
  standby(authResetKeyResend, 'resend password reset key')
)

router.get(
  '/reset/:key',
  validationRules([validationMap.get('resetKey')]),
  standby(authResetKeyCheck, 'evaluate password reset key')
)

router.post(
  '/reset/:key',
  express.json(),
  validationRules([
    validationMap.get('resetKey'),
    validationMap.get('username'),
    validationMap.get('password')
  ]),
  standby(authResetKeyApply, 'reset account password')
)

export { router as authRouter }
