// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { EPlatformRole } from '@touca/api-schema'
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

/**
 * @api [get] /platform
 *    tags:
 *      - Platform
 *    summary: 'Check Platform Health'
 *    operationId: 'platform_health'
 *    description:
 *      Provides health status of the Touca server
 *    responses:
 *      200:
 *        description:
 *          Indicates whether the platform is ready to accept submissions.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_PlatformStatus'
 */
router.get('/', promisable(platformHealth, 'check platform health'))

/**
 * @api [post] /platform/install
 *    tags:
 *      - Platform
 *    summary: 'Register Server'
 *    operationId: platform_install
 *    description:
 *      Adds contact information to this server instance.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - name
 *            properties:
 *              company:
 *                type: string
 *              email:
 *                type: string
 *              name:
 *                type: string
 *      required: true
 *    responses:
 *      204:
 *        description: 'Server registered'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/install',
  express.json(),
  promisable(platformInstall, 'register server')
)

/**
 * @api [get] /platform/config
 *    tags:
 *      - Platform
 *    summary: 'Get Server Settings'
 *    operationId: 'platform_config'
 *    description:
 *      Reports server settings.
 *      If server is already configured, user initiating the request must be authenticated
 *      and a server admin.
 *    responses:
 *      200:
 *        description:
 *          Server settings
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_PlatformConfig'
 */
router.get('/config', promisable(platformConfig, 'get platform configuration'))

/**
 * @api [patch] /platform/config
 *    tags:
 *      - Platform
 *    summary: 'Update Server Settings'
 *    operationId: platform_update
 *    description:
 *      Updates server settings.
 *      If server is already configured, user initiating the request must be authenticated
 *      and a server admin.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              telemetry:
 *                type: boolean
 *      required: true
 *    responses:
 *      204:
 *        description: 'Server settings was updated.'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 */
router.patch(
  '/config',
  express.json(),
  promisable(platformUpdate, 'update platform settings')
)

/**
 * @api [get] /platform/stats
 *    tags:
 *      - Platform
 *    summary: 'Get Platform Statistics'
 *    operationId: 'platform_stats'
 *    description:
 *      Provides statistics about this Touca server instance.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a platform admin.
 *    responses:
 *      200:
 *        description:
 *          Statistics about this platform instance.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_PlatformStatsResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/stats',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  promisable(platformStats, 'get platform statistics')
)

/**
 * Updates profile of an existing user on the platform.
 *
 * @api [patch] /platform/account/:account
 *    tags:
 *      - Platform
 *    summary: Update Account Information
 *    operationId: platform_accountUpdate
 *    description:
 *      Updates profile of an existing account on the platform.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a platform admin.
 *    parameters:
 *      - $ref: '#/components/parameters/account'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            additionalProperties: false
 *            type: object
 *            required:
 *              - role
 *            properties:
 *              role:
 *                type: string
 *                enum: [user, admin]
 *    responses:
 *      204:
 *        description: 'Account Profile Updated'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: User Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/account/:account',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  express.json(),
  middleware.inputs([
    ev
      .body('role')
      .custom((v) =>
        Object.values(EPlatformRole)
          .filter(
            (e: EPlatformRole) =>
              ![EPlatformRole.Owner, EPlatformRole.Super].includes(e)
          )
          .includes(v)
      )
      .withMessage('invalid')
  ]),
  promisable(platformAccountUpdate, 'update account profile on platform')
)

/**
 * Populates an existing account with sample test results.
 *
 * @api [post] /platform/account/:account/populate
 *    tags:
 *      - Platform
 *    summary: Populate account with sample data
 *    operationId: platform_accountPopulate
 *    description:
 *      Populates an existing account with sample test results.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a platform admin.
 *    parameters:
 *      - $ref: '#/components/parameters/account'
 *    responses:
 *      204:
 *        description: 'Sample data added'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: User Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/account/:account/populate',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  promisable(platformAccountPopulate, 'populate account with sample data')
)

/**
 * Suspends a given account.
 *
 * @api [post] /platform/account/:account/suspend
 *    tags:
 *      - Platform
 *    summary: Suspend a given account
 *    operationId: platform_accountSuspend
 *    description:
 *      Suspends a given account and removes all its active sessions.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a platform admin.
 *    parameters:
 *      - $ref: '#/components/parameters/account'
 *    responses:
 *      204:
 *        description: 'Account suspended.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: User Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/account/:account/suspend',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasAccount,
  promisable(platformAccountSuspend, 'suspend account')
)

/**
 * Removes user's account and all data associated with it.
 *
 * @api [post] /platform/account/:account/delete
 *    tags:
 *      - Platform
 *    summary: Delete a given account
 *    operationId: platform_accountDelete
 *    description:
 *      Deletes a given account and all data associated with it.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a platform admin.
 *      User being removed must not have any active team membership.
 *      User being removed must not have any pending team invitation.
 *      User being removed must not have any pending join request.
 *    responses:
 *      204:
 *        description: 'Account Deleted'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        description: 'Account cannot be deleted'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/account/:account/delete',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasSuspendedAccount,
  promisable(platformAccountDelete, 'delete account')
)

export const platformRouter = router
