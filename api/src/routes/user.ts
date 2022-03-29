// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { ctrlUserDelete } from '@/controllers/user/delete'
import { userLookup } from '@/controllers/user/lookup'
import { userSessions } from '@/controllers/user/sessions'
import { userUpdate } from '@/controllers/user/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

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
 *      - User
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
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('fullname').optional(),
    middleware.validationRules.get('username').optional(),
    middleware.validationRules.get('password').optional()
  ]),
  promisable(userUpdate, 'update user')
)

/**
 * Removes user's account and all data associated with it.
 *
 * @api [delete] /user
 *    tags:
 *      - User
 *    summary: Delete User Account
 *    operationId: user_delete
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
  '/',
  middleware.isAuthenticated,
  promisable(ctrlUserDelete, 'delete own account')
)

/**
 * Provides list of active sessions of this user.
 *
 * @api [get] /user/sessions
 *    tags:
 *      - User
 *    summary: List Active User Sessions
 *    operationId: user_sessions
 *    description:
 *      Provides list of active sessions of this user.
 *      User performing the query must be authenticated.
 *    responses:
 *      200:
 *        description: 'Active User Sessions'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_UserSessionsResponseItem'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/sessions',
  middleware.isAuthenticated,
  promisable(userSessions, 'list active sessions')
)

export const userRouter = router
