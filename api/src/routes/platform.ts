/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import { EPlatformRole } from '../commontypes'
import * as middleware from '../middlewares'
import { promisable } from '../utils/routing'
import { platformAccountUpdate } from '../controllers/platform/accountUpdate'
import { platformHealth } from '../controllers/platform/health'

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
 *      503:
 *        description: Failed to assess platform health.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.get('/', promisable(platformHealth, 'check platform health'))

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

export const platformRouter = router
