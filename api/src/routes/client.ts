// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { clientElementList } from '@/controllers/client/elementList'
import { clientSessionCreate } from '@/controllers/client/sessionCreate'
import { clientSubmit } from '@/controllers/client/submit'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

/**
 * Authenticate via API Key.
 *
 * @api [post] /client/signin
 *    tags:
 *      - Client
 *    summary: 'Create Client Session'
 *    operationId: 'client_signin'
 *    description:
 *      Authenticate to Touca Server API.
 *      Creates a temporary client session.
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
 *                format: uuid
 *      required: true
 *    responses:
 *      200:
 *        description: 'Client Session Created'
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
    ev
      .body('key')
      .exists()
      .withMessage('required')
      .isUUID()
      .withMessage('invalid')
  ]),
  promisable(clientSessionCreate, 'create client session')
)

/**
 * List test cases in baseline version of a given suite.
 *
 * @api [get] /client/element/:team/:suite
 *    tags:
 *      - Client
 *    summary: List Elements
 *    operationId: client_elements
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
  '/element/:team/:suite',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(clientElementList, 'list suite elements')
)

/**
 * Handles regression test results submitted by endpoints.
 *
 * @api [post] /client/submit
 *    tags:
 *      - Client
 *    summary: 'Submit Results'
 *    operationId: 'client_submit'
 *    description:
 *      Handles test results submitted via Touca SDKs.
 *      Client initiating the request must be authenticated.
 *    requestBody:
 *      description:
 *        Valid binary data that conforms to Touca flatbuffers schema.
 *        Submission file cannot be larger than 50 MB in size.
 *      content:
 *        application/octet-stream:
 *          schema:
 *            type: string
 *            format: binary
 *      required: true
 *    responses:
 *      204:
 *        description: 'Results Submitted'
 *      400:
 *        description:
 *          Results do not conform to Touca flatbuffers Schema.
 *          Or platform rejects processing the results for other reasons.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
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
  '/submit',
  middleware.isClientAuthenticated,
  express.raw({ limit: '50mb' }),
  promisable(clientSubmit, 'handle submitted result')
)

export const clientRouter = router
