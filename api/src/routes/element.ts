// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import e from 'express'

import { elementCompare } from '@/controllers/element/compare'
import { elementList } from '@/controllers/element/list'
import { elementLookup } from '@/controllers/element/lookup'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = e.Router()

/**
 * List test cases in baseline version of a given suite.
 *
 * @api [get] /element/:team/:suite
 *    tags:
 *      - Element
 *    summary: List Elements
 *    operationId: element_list
 *    description:
 *      List all test suites in baseline version of a given suite.
 *      User performing the query must be authenticated.
 *      User performing the query must be a member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      200:
 *        description: 'List of Test Cases'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_ElementListResponse'
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
router.get(
  '/:team/:suite',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(elementList, 'list suite elements')
)

/**
 * Learn more about an element.
 *
 * @api [get] /element/:team/:suite/:element
 *    tags:
 *      - Element
 *    summary: Lookup Element
 *    operationId: element_lookup
 *    description:
 *      Learn more about an element in a given suite.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/element'
 *    responses:
 *      200:
 *        description: Detailed information about this element.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_ElementLookupResponse'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Element Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.get(
  '/:team/:suite/:element',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasElement,
  promisable(elementLookup, 'lookup an element')
)

/**
 * Compare two messages submitted for the same element in two batches.
 *
 * @api [get] /element/:team/:suite/:element/compare/:batch/:dstBatch/:dstElement/:dstSuite
 *    tags:
 *      - Element
 *    summary: Compare Elements
 *    operationId: element_compare
 *    description:
 *      Compare results submitted for the same element between two batches.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/element'
 *      - $ref: '#/components/parameters/batch'
 *      - $ref: '#/components/parameters/dstBatch'
 *      - $ref: '#/components/parameters/dstElement'
 *      - $ref: '#/components/parameters/dstSuite'
 *    responses:
 *      200:
 *        description: Comparison Results
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_ElementComparisonResponse'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Element or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      503:
 *        description: 'Failed to Perform Comparison'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.get(
  '/:team/:suite/:element/compare/:batch/:dstBatch/:dstElement/:dstSuite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasElement,
  middleware.hasBatch,
  promisable(elementCompare, 'compare an element')
)

export const elementRouter = router
