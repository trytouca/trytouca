// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { authGoogleSignin } from '@/controllers/auth/googleSignin'
import { authResetKeyApply } from '@/controllers/auth/resetKeyApply'
import { authResetKeyCheck } from '@/controllers/auth/resetKeyCheck'
import { authResetKeyCreate } from '@/controllers/auth/resetKeyCreate'
import { authResetKeyResend } from '@/controllers/auth/resetKeyResend'
import { authSessionCreate } from '@/controllers/auth/sessionCreate'
import { authSessionExtend } from '@/controllers/auth/sessionExtend'
import { authSessionRemove } from '@/controllers/auth/sessionRemove'
import { authVerifyActivate } from '@/controllers/auth/verifyActivate'
import { authVerifyCreate } from '@/controllers/auth/verifyCreate'
import { authVerifyResend } from '@/controllers/auth/verifyResend'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.post(
  '/signup',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authVerifyCreate, 'create user account')
)

router.post(
  '/signup/resend',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authVerifyResend, 'resend verification email')
)

router.post(
  '/activate/:key',
  promisable(authVerifyActivate, 'activate user account')
)

router.post(
  '/signin',
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('username'),
    middleware.validationRules.get('password')
  ]),
  promisable(authSessionCreate, 'create session')
)

router.post(
  '/signin/google',
  express.json(),
  middleware.inputs([middleware.validationRules.get('google_token')]),
  promisable(authGoogleSignin, 'create google session')
)

router.post(
  '/signout',
  middleware.isAuthenticated,
  promisable(authSessionRemove, 'remove session')
)

router.post(
  '/extend',
  middleware.isAuthenticated,
  promisable(authSessionExtend, 'extend session')
)

router.post(
  '/reset',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authResetKeyCreate, 'create password reset key')
)

router.post(
  '/reset/resend',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authResetKeyResend, 'resend password reset key')
)

router.get(
  '/reset/:key',
  middleware.inputs([middleware.validationRules.get('resetKey')]),
  promisable(authResetKeyCheck, 'evaluate password reset key')
)

router.post(
  '/reset/:key',
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('resetKey'),
    middleware.validationRules.get('username'),
    middleware.validationRules.get('password')
  ]),
  promisable(authResetKeyApply, 'reset account password')
)

export { router as authRouter }
