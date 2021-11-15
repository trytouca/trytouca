// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { batchCompare } from '@/controllers/batch/compare'
import { ctrlBatchList } from '@/controllers/batch/list'
import { ctrlBatchLookup } from '@/controllers/batch/lookup'
import { ctrlBatchPromote } from '@/controllers/batch/promote'
import { ctrlBatchRemove } from '@/controllers/batch/remove'
import { ctrlBatchSeal } from '@/controllers/batch/seal'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

/**
 * List all batches in a given suite.
 *
 * @api [get] /batch/:team/:suite
 *    tags:
 *      - Batch
 *    summary: List Batches
 *    operationId: batch_list
 *    description:
 *      List all batches in a given suite.
 *      User performing the query must be authenticated.
 *      User performing the query must be a member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      200:
 *        description: List of Batches
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/CT_BatchListResponse'
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
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(ctrlBatchList, 'list batches')
)

/**
 * Learn more about a batch.
 *
 * @api [get] /batch/:team/:suite/:batch
 *    tags:
 *      - Batch
 *    summary: Lookup Batch
 *    operationId: batch_lookup
 *    description:
 *      Learn more about a batch in a given suite.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *      Output may have been cached in the server.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *    responses:
 *      200:
 *        description: Detailed information about this batch.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_BatchLookupResponse'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.get(
  '/:team/:suite/:batch',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchLookup, 'lookup a batch')
)

/**
 * Remove a batch and all data associated with it.
 *
 * @api [delete] /batch/:team/:suite/:batch
 *    tags:
 *      - Batch
 *    summary: 'Remove Batch'
 *    operationId: 'batch_remove'
 *    description:
 *      Remove a batch and all data associated with it.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *      Batch must be sealed.
 *      Batch must not be baseline of the suite it belongs to.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *    responses:
 *      202:
 *        description: 'Batch Scheduled for Removal'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.delete(
  '/:team/:suite/:batch',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchRemove, 'remove a batch')
)

/**
 * Seal a version of the specified suite.
 *
 * @api [post] /batch/:team/:suite/:batch/seal
 *    tags:
 *      - Batch
 *    summary: 'Seal a Batch'
 *    operationId: 'batch_seal'
 *    description:
 *      Seals a version of the specified suite to prevent additional
 *      results to be submitted for that version. This is rarely
 *      necessary given that batches are automatically sealed by the
 *      backend after a period of time after their submission.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *    responses:
 *      204:
 *        description: 'Batch Sealed'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/:suite/:batch/seal',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
)

router.post(
  '/:team/:suite/:batch/seal2',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
)

/**
 * Promote a batch to baseline of the suite it belongs to.
 *
 * @api [post] /batch/:team/:suite/:batch/promote
 *    tags:
 *      - Batch
 *    summary: 'Promote a Batch'
 *    operationId: 'batch_promote'
 *    description:
 *      Promote a batch to baseline of the suite it belongs to.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be member of the team.
 *      Batch to be promoted should be sealed.
 *      Batch to be promoted should not be empty.
 *
 *      We support empty promotion reason only for the first submitted batch
 *      whose workflow does not include calling this route. hence, we choose
 *      to reject empty reasons for all subsequent promotions that happened
 *      through this route.
 *
 *      We think a valid promotion reason should be no longer than
 *      a single paragraph. Assuming a normal paragraph includes 200
 *      words with average length of 5, we allow at most 1500 characters
 *      to be entered for promotion reason.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - reason
 *            properties:
 *              reason:
 *                type: string
 *                minLength: 0
 *                maxLength: 1500
 *      required: true
 *    responses:
 *      204:
 *        description: 'Batch Promoted'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/:suite/:batch/promote',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  express.json(),
  middleware.inputs([middleware.validationRules.get('reason')]),
  promisable(ctrlBatchPromote, 'promote a batch')
)

/**
 * Compare a batch with another batch.
 *
 * @api [get] /batch/:team/:suite/:batch/compare/:dstBatch/:dstSuite
 *    tags:
 *      - Batch
 *    summary: Compare Batch
 *    operationId: batch_compare
 *    description:
 *      Compare a batch with another batch.
 *      Compare results submitted for a batch to results submitted
 *      for another batch.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *      - $ref: '#/components/parameters/dstBatch'
 *      - $ref: '#/components/parameters/dstSuite'
 *    responses:
 *      200:
 *        description: Comparison Results
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_BatchComparisonResponse'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: 'Team or Suite or Batch Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      503:
 *        description: 'Failed to perform comparison'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.get(
  '/:team/:suite/:batch/compare/:dstBatch/:dstSuite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(batchCompare, 'compare a batch')
)

export const batchRouter = router
