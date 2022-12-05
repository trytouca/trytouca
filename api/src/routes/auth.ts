// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { authGoogleSignin } from '../controllers/auth/googleSignin.js'
import { authResetKeyApply } from '../controllers/auth/resetKeyApply.js'
import { authResetKeyCheck } from '../controllers/auth/resetKeyCheck.js'
import { authResetKeyCreate } from '../controllers/auth/resetKeyCreate.js'
import { authResetKeyResend } from '../controllers/auth/resetKeyResend.js'
import { authSessionCreate } from '../controllers/auth/sessionCreate.js'
import { authSessionExtend } from '../controllers/auth/sessionExtend.js'
import { authSessionRemove } from '../controllers/auth/sessionRemove.js'
import { authVerifyActivate } from '../controllers/auth/verifyActivate.js'
import { authVerifyCreate } from '../controllers/auth/verifyCreate.js'
import { authVerifyResend } from '../controllers/auth/verifyResend.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

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
