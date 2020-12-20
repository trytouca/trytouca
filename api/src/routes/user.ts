/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import e from 'express'

import * as middleware from '../middlewares'
import { promisable } from '../utils/routing'
import { userLookup } from '../controllers/user/lookup'

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
router.get('/',
  middleware.isAuthenticated,
  promisable(userLookup, 'lookup user information')
)

export const userRouter = router
