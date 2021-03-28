/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import * as middleware from '../middlewares'
import { comparisonList } from '@weasel/controllers/comparison/list'
import { comparisonProcess } from '@weasel/controllers/comparison/process'
import { messageProcess } from '@weasel/controllers/message/process'
import { promisable } from '@weasel/utils/routing'

const router = e.Router()

/**
 * List pending comparison jobs.
 *
 * @api [get] /cmp
 *    tags:
 *      - Comparison
 *    summary: List Comparison Jobs
 *    operationId: comparison_list
 *    description:
 *      List pending comparison jobs.
 *      Designed for use by Weasel Comparator.
 *    responses:
 *      200:
 *        description: List of comparison jobs.
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                additionalProperties: false
 *                required:
 *                  - _id
 *                  - dstBatch
 *                  - dstMessage
 *                  - dstProcessed
 *                  - srcBatch
 *                  - srcMessage
 *                  - srcProcessed
 *                properties:
 *                  _id:
 *                    $ref: '#/components/schemas/ObjectId'
 *                  dstBatch:
 *                    $ref: '#/components/schemas/ObjectId'
 *                  dstMessage:
 *                    $ref: '#/components/schemas/ObjectId'
 *                  dstProcessed:
 *                    type: boolean
 *                  srcBatch:
 *                    $ref: '#/components/schemas/ObjectId'
 *                  srcMessage:
 *                    $ref: '#/components/schemas/ObjectId'
 *                  srcProcessed:
 *                    type: boolean
 */
router.get('/', promisable(comparisonList, 'list comparison jobs'))

/**
 * Submit results for a comparison job.
 *
 * @api [patch] /cmp/job/:job
 *    tags:
 *      - Comparison
 *    summary: Submit Comparison Result
 *    operationId: comparison_process
 *    description:
 *      Submit results for a comparison job.
 *      Designed for use by Weasel Comparator.
 *    parameters:
 *      - $ref: '#/components/parameters/job'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            additionalProperties: false
 *            required:
 *              - overview
 *              - body
 *            properties:
 *              overview:
 *                $ref: '#/components/schemas/CT_CppTestcaseOverview'
 *              body:
 *                $ref: '#/components/schemas/Unknown'
 *    responses:
 *      204:
 *        description: 'Comparison Result Submitted'
 *      404:
 *        description: 'Job Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      409:
 *        description: 'Job Already Processed'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      413:
 *        description: 'Comparison Result Too Large'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/job/:job',
  middleware.inputs([ev.param('job').isMongoId().withMessage('job invalid')]),
  bodyParser.json({ limit: '5mb' }),
  promisable(comparisonProcess, 'process comparison job')
)

/**
 * Submit parsed json representation of a message.
 *
 * @api [patch] /cmp/message/:message
 *    tags:
 *      - Comparison
 *    summary: Submit Message Result
 *    operationId: message_process
 *    description:
 *      Submit parsed json representation of a message.
 *      Designed for use by Weasel Comparator.
 *    parameters:
 *      - name: message
 *        in: path
 *        required: true
 *        description: 'unique identifier for this message'
 *        schema:
 *          $ref: '#/components/schemas/ObjectId'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            additionalProperties: false
 *            required:
 *              - overview
 *              - body
 *            properties:
 *              overview:
 *                $ref: '#/components/schemas/CT_CppTestcaseComparisonOverview'
 *              body:
 *                $ref: '#/components/schemas/Unknown'
 *    responses:
 *      204:
 *        description: 'Message Result Submitted'
 *      404:
 *        description: 'Message Not Found'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      409:
 *        description: 'Message Already Processed'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      413:
 *        description: 'Message Result Too Large'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/message/:message',
  middleware.inputs([
    ev.param('message').isMongoId().withMessage('job invalid')
  ]),
  bodyParser.json({ limit: '5mb' }),
  promisable(messageProcess, 'process message')
)

export const comparisonRouter = router
