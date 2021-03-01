/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as middleware from '../middlewares'
import { promisable } from '../utils/routing'
import { userLookup } from '../controllers/user/lookup'
import { ctrlUserUpdate } from '../controllers/user/update'

const router = e.Router()

/**
 * Provides non-sensitive account information about this user.
 *
 * @api [get] /user
 *    tags:
 *      - User
 *    summary: Lookup Current User
 *    operationId: user_lookup
 *    description:
 *      Provides non-sensitive account information about the user
 *      performing this query.
 *      User performing the query must be authenticated.
 *    responses:
 *      200:
 *        description: 'Basic Account Information'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_UserLookupResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  middleware.isAuthenticated,
  promisable(userLookup, 'lookup user information')
)

/**
 * Update account information of this user.
 *
 * @api [patch] /user
 *    tags:
 *      - Suite
 *    summary: Update Account Information
 *    operationId: user_update
 *    description:
 *      Updates user information.
 *      User initiating the request must be authenticated.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              fullname:
 *                type: string
 *              username:
 *                type: string
 *              password:
 *                type: string
 *      required: true
 *    responses:
 *      204:
 *        description: 'User information was updated.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 */
router.patch(
  '/',
  middleware.isAuthenticated,
  bodyParser.json(),
  middleware.inputs([
    middleware.validationRules.get('fullname').optional(),
    middleware.validationRules.get('username').optional(),
    middleware.validationRules.get('password').optional()
  ]),
  promisable(ctrlUserUpdate, 'update user')
)

export const userRouter = router
