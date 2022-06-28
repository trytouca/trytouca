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

/**
 * Create a user account.
 *
 * @api [post] /auth/signup
 *    tags:
 *      - Account
 *    summary: 'Create Account'
 *    operationId: 'account_signup'
 *    description:
 *      Create a user account.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *      required: true
 *    responses:
 *      201:
 *        description: 'Account Created'
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: Link to signin route
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 */
router.post(
  '/signup',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authVerifyCreate, 'create user account')
)

/**
 * Resend account activation key.
 *
 * @api [post] /auth/signup/resend
 *    tags:
 *      - Account
 *    summary: 'Resend Activation Link'
 *    operationId: 'account_verifyResend'
 *    description:
 *      Resend account activation key.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *      required: true
 *    responses:
 *      204:
 *        description: 'Activation Link Resent'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      404:
 *        description: 'Account Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/signup/resend',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authVerifyResend, 'resend verification email')
)

/**
 * Activate a user account.
 *
 * @api [post] /auth/activate/:key
 *    tags:
 *      - Account
 *    summary: 'Activate Account'
 *    operationId: 'account_verifyActivate'
 *    description:
 *      Activate a user account.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - key
 *            properties:
 *              key:
 *                type: string
 *                minLength: 8
 *      required: true
 *    responses:
 *      200:
 *        description: 'Account Activated'
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
 *      404:
 *        description: 'Activation Key Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/activate/:key',
  promisable(authVerifyActivate, 'activate user account')
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
  middleware.inputs([
    middleware.validationRules.get('username'),
    middleware.validationRules.get('password')
  ]),
  promisable(authSessionCreate, 'create session')
)

/**
 * Login using Google account.
 *
 * @api [post] /auth/signin/google
 *    tags:
 *      - Account
 *    summary: 'Create User Session'
 *    operationId: 'account_signin_google'
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
  middleware.inputs([middleware.validationRules.get('google_token')]),
  promisable(authGoogleSignin, 'create google session')
)

/**
 * Log out of an account.
 *
 * @api [post] /auth/signout
 *    tags:
 *      - Account
 *    summary: 'Remove User Session'
 *    operationId: 'account_signout'
 *    description:
 *      Log out of a user account.
 *      Removes a user session.
 *    responses:
 *      204:
 *        description: 'User Session Removed'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      404:
 *        description: 'Session Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/signout',
  middleware.isAuthenticated,
  promisable(authSessionRemove, 'remove session')
)

/**
 * Extend this user session.
 *
 * @api [post] /auth/extend
 *    tags:
 *      - Account
 *    summary: 'Extend User Session'
 *    operationId: 'account_sessionExtend'
 *    description:
 *      Extend this user session.
 *    responses:
 *      200:
 *        description: 'User Session Extended'
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
 */
router.post(
  '/extend',
  middleware.isAuthenticated,
  promisable(authSessionExtend, 'extend session')
)

/**
 * Initiate the process to reset account password.
 *
 * @api [post] /auth/reset
 *    tags:
 *      - Account
 *    summary: 'Create Password Reset Key'
 *    operationId: 'account_resetKeyCreate'
 *    description:
 *      Initiate the process to reset account password.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *      required: true
 *    responses:
 *      204:
 *        description: 'Password Reset Key Generated'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      404:
 *        description: 'Account Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      423:
 *        description: 'Account Locked or Suspended'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/reset',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authResetKeyCreate, 'create password reset key')
)

/**
 * Resend password reset email.
 *
 * @api [post] /auth/reset/resend
 *    tags:
 *      - Account
 *    summary: 'Resend Password Reset Key'
 *    operationId: 'account_resetKeyResend'
 *    description:
 *      Resend password reset key.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *      required: true
 *    responses:
 *      204:
 *        description: 'Password Reset Key Resent'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      404:
 *        description: 'Account Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/reset/resend',
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(authResetKeyResend, 'resend password reset key')
)

/**
 * Provides basic information for an account associated with a given reset key.
 *
 * @api [get] /auth/reset/:key
 *    tags:
 *      - Account
 *    summary: 'Reset Account Password'
 *    operationId: 'account_resetKeyCheck'
 *    description:
 *      Provides basic information for an account associated with a given
 *      reset key.
 *    parameters:
 *      - $ref: '#/components/parameters/resetKey'
 *    responses:
 *      200:
 *        description: 'Basic Account Information'
 *        content:
 *          application/json:
 *            schema:
 *              additionalProperties: false
 *              type: object
 *              required:
 *                - email
 *                - fullname
 *                - username
 *              properties:
 *                email:
 *                  type: string
 *                fullname:
 *                  type: string
 *                username:
 *                  type: string
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 */
router.get(
  '/reset/:key',
  middleware.inputs([middleware.validationRules.get('resetKey')]),
  promisable(authResetKeyCheck, 'evaluate password reset key')
)

/**
 * Reset Account Password.
 *
 * @api [post] /auth/reset/:key
 *    tags:
 *      - Account
 *    summary: 'Reset Account Password'
 *    operationId: 'account_resetKeyApply'
 *    description:
 *      Set a new password for a user account using a previously
 *      issued reset key.
 *    parameters:
 *      - $ref: '#/components/parameters/resetKey'
 *    responses:
 *      204:
 *        description: 'Account Password was Reset'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      404:
 *        description: 'Reset Key Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
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

export const authRouter = router
