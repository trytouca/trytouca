// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import { ctrlSuiteCreate } from '@/controllers/suite/create'
import { ctrlSuiteList } from '@/controllers/suite/list'
import { ctrlSuiteLookup } from '@/controllers/suite/lookup'
import { ctrlSuiteRemove } from '@/controllers/suite/remove'
import { suiteSubscribe } from '@/controllers/suite/subscribe'
import { suiteUnsubscribe } from '@/controllers/suite/unsubscribe'
import { suiteUpdate } from '@/controllers/suite/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = e.Router()

/**
 * Lists all the suites registered for a given team.
 *
 * @api [get] /suite/:team
 *    tags:
 *      - Suite
 *    summary: List Suites
 *    operationId: suite_list
 *    description:
 *      Lists all the suites registered for a given team.
 *      User performing the query must be authenticated.
 *      User performing the query must be a member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      200:
 *        description: List of Suites
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/CT_SuiteListResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.get(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(ctrlSuiteList, 'list suites')
)

/**
 * Create a new suite in a given team.
 *
 * @api [post] /suite/:team
 *    tags:
 *      - Suite
 *    summary: Create Suite
 *    operationId: suite_create
 *    description:
 *      Create a new suite in a given team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - name
 *              - slug
 *            properties:
 *              name:
 *                type: string
 *              slug:
 *                type: string
 *    responses:
 *      201:
 *        description: Suite Created
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: Link to newly created suite
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: Suite Already Registered
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  bodyParser.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name'),
    ev.body('name').exists().withMessage('required'),
    middleware.validationRules.get('entity-slug'),
    ev.body('slug').exists().withMessage('required')
  ]),
  promisable(ctrlSuiteCreate, 'create suite')
)

/**
 * Learn more about a suite.
 *
 * @api [get] /suite/:team/:suite
 *    tags:
 *      - Suite
 *    summary: Lookup Suite
 *    operationId: suite_lookup
 *    description:
 *      Learn more about a suite in a given team.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      200:
 *        description: 'Detailed information about this suite'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_SuiteLookupResponse'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.get(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(ctrlSuiteLookup, 'lookup suite')
)

/**
 * Update metadata of a suite in a given team.
 *
 * @api [patch] /suite/:team/:suite
 *    tags:
 *      - Suite
 *    summary: Update Suite
 *    operationId: team_suite
 *    description:
 *      Update suite information in a given team.
 *      User initiating the request must be authenticated.
 *      User initiation the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              slug:
 *                type: string
 *              retainFor:
 *                type: number
 *                minimum: 86400
 *                maximum: 157680000
 *                multipleOf: 1
 *      required: true
 *    responses:
 *      201:
 *        description:
 *          Metadata of the suite was updated.
 *          Suite is now known by a new slug.
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: Link to the team with its new slug
 *      204:
 *        description:
 *          Metadata of the suite was updated.
 *          Suite slug has not changed.
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team Not Found or Suite Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  bodyParser.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name').optional(),
    middleware.validationRules.get('entity-slug').optional(),
    ev
      .body('retainFor')
      .isInt({ min: 86400, max: 157680000 })
      .withMessage('not a number')
      .isDivisibleBy(60)
      .withMessage('invalid')
      .optional(),
    ev
      .body('sealAfter')
      .isFloat({ min: 60, max: 86400 })
      .withMessage('not a number')
      .isDivisibleBy(60)
      .withMessage('invalid')
      .optional()
  ]),
  promisable(suiteUpdate, 'update suite')
)

/**
 * Removes a suite and all data associated with it.
 *
 * @api [delete] /suite/:team/:suite
 *    tags:
 *      - Suite
 *    summary: Remove Suite
 *    operationId: suite_remove
 *    description:
 *      Removes a suite and all data associated with it.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      202:
 *        description: 'Suite Scheduled for Removal'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.delete(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasSuite,
  promisable(ctrlSuiteRemove, 'remove suite')
)

/**
 * Subscribe to a suite in a given team.
 *
 * @api [post] /suite/:team/:suite/subscribe
 *    tags:
 *      - Suite
 *    summary: 'Subscribe to Suite'
 *    operationId: 'suite_subscribe'
 *    description:
 *      Subscribe to a suite in a given team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      204:
 *        description: 'User Subscribed to Suite'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team Not Found or Suite Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/:suite/subscribe',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(suiteSubscribe, 'subscribe suite')
)

/**
 * Unsubscribe from a suite in a given team.
 *
 * @api [post] /suite/:team/:suite/unsubscribe
 *    tags:
 *      - Suite
 *    summary: 'Unsubscribe from Suite'
 *    operationId: 'suite_unsubscribe'
 *    description:
 *      Unsubscribe from a suite in a given team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      204:
 *        description: 'User Unsubscribed from Suite'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team Not Found or Suite Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/:suite/unsubscribe',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(suiteUnsubscribe, 'unsubscribe suite')
)

export const suiteRouter = router
