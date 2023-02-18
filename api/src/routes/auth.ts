// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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

/**
 * Log into an account.
 *
 * @api [post] /auth/signin
 *    tags:
 *      - Account
 *    summary: 'Create User Session'
 *    operationId: 'account_signin'
 *    description:
 *      Log into a user account.
 *      Creates a user session.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - password
 *              - username
 *            properties:
 *              password:
 *                type: string
 *                minLength: 8
 *              username:
 *                type: string
 *                minLength: 3
 *                maxLength: 32
 *      required: true
 *    responses:
 *      200:
 *        description: 'Session Created'
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              additionalProperties: false
 *              properties:
 *                expiresAt:
 *                  type: string
 *                  format: date-time
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      423:
 *        description: 'Account Locked or Suspended'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/signin',
  express.json(),
  validationRules([validationMap.get('email'), validationMap.get('password')]),
  standby(authSessionCreate, 'create session')
)

/**
 * Login using Google account.
 *
 * @api [post] /auth/signin/google
 *    tags:
 *      - Account
 *    summary: 'Create User Session'
 *    operationId: 'account_signin'
 *    description:
 *      Log into a user account.
 *      Creates a user session.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - google_token
 *            properties:
 *              google_token:
 *                type: string
 *      required: true
 *    responses:
 *      200:
 *        description: 'Session Created'
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              additionalProperties: false
 *              properties:
 *                expiresAt:
 *                  type: string
 *                  format: date-time
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      423:
 *        description: 'Account Locked or Suspended'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
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
    validationMap.get('email'),
    validationMap.get('password')
  ]),
  standby(authResetKeyApply, 'reset account password')
)

export { router as authRouter }
