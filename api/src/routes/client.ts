/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import * as middleware from '../middlewares'
import { clientSessionCreate } from '@weasel/controllers/client/sessionCreate'
import { clientSubmit } from '@weasel/controllers/client/submit'
import { promisable } from '@weasel/utils/routing'

const router = e.Router()

/**
 * Authenticate via API Key.
 *
 * @api [post] /client/signin
 *    tags:
 *      - Client
 *    summary: 'Create Client Session'
 *    operationId: 'client_signin'
 *    description:
 *      Authenticate to Platform API.
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
  bodyParser.json(),
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
 * Handles regression test results submitted by endpoints.
 *
 * @api [post] /client/submit
 *    tags:
 *      - Client
 *    summary: 'Submit Results'
 *    operationId: 'client_submit'
 *    description:
 *      Allows regression test tools to submit new test results to the
 *      platform.
 *      Client initiating the request must be authenticated.
 *    requestBody:
 *      description:
 *        Valid binary data that conforms to Weasel flatbuffers schema.
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
 *          Results do not conform to Weasel flatbuffers Schema.
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
  bodyParser.raw({ limit: '50mb' }),
  promisable(clientSubmit, 'handle submitted result')
)

export const clientRouter = router
