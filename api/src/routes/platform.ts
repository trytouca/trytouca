/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { accountDelete } from '@weasel/controllers/platform/accountDelete'
import { platformAccountPopulate } from '@weasel/controllers/platform/accountPopulate'
import { platformAccountSuspend } from '@weasel/controllers/platform/accountSuspend'
import { platformAccountUpdate } from '@weasel/controllers/platform/accountUpdate'
import { platformHealth } from '@weasel/controllers/platform/health'
import { platformStats } from '@weasel/controllers/platform/stats'
import * as middleware from '@weasel/middlewares'
import { EPlatformRole } from '@weasel/types/commontypes'
import { promisable } from '@weasel/utils/routing'
import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

const router = e.Router()

/**
 * @api [get] /platform
 *    tags:
 *      - Platform
 *    summary: 'Check Platform Health'
 *    operationId: 'platform_health'
 *    description:
 *      Provides health status of the Weasel Platform
 *    responses:
 *      200:
 *        description:
 *          Indicates whether the platform is ready to accept submissions.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              additionalProperties: false
 *              required:
 *                - ready
 *                - mail
 *              properties:
 *                ready:
 *                  type: boolean
 *                mail:
 *                  type: boolean
 */
router.get('/', promisable(platformHealth, 'check platform health'))

/**
 * @api [get] /platform/stats
 *    tags:
 *      - Platform
 *    summary: 'Get Platform Statistics'
 *    operationId: 'platform_stats'
 *    description:
 *      Provides statistics about this Weasel Platform instance.
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
  bodyParser.json(),
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
 * @api [delete] /platform/account
 *    tags:
 *      - Account
 *    summary: Remove Account
 *    operationId: account_remove
 *    description:
 *      Removes user's account and all data associated with it.
 *      User initiating the request must be authenticated.
 *      User initiating the request must not be the platform owner.
 *      User must not have any active team membership.
 *      User must not have any pending team invitation.
 *      User must not have any pending join request.
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
router.delete(
  '/account',
  middleware.isAuthenticated,
  promisable(accountDelete, 'delete own account')
)

export const platformRouter = router
