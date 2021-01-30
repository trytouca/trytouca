/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import * as middleware from '../middlewares'

import { authRouter } from './auth'
import { batchRouter } from './batch'
import { clientRouter } from './client'
import { commentRouter } from './comment'
import { comparisonRouter } from './comparison'
import { elementRouter } from './element'
import { inboxRouter } from './inbox'
import { platformRouter } from './platform'
import { suiteRouter } from './suite'
import { teamRouter } from './team'
import { userRouter } from './user'

import { feedback } from '../controllers/misc/feedback'

import { config } from '../utils/config'
import { promisable } from '../utils/routing'

const router = e.Router()

/**
 * API Entrypoint
 *
 * @api [get] /
 *    tags:
 *      - Other
 *    summary: 'Entrypoint'
 *    operationId: 'misc_index'
 *    description:
 *      Reassures curious engineers who browse to the Backend URL that
 *      the Weasel Platform is up and running.
 *    responses:
 *      302:
 *        description:
 *          Path to route that provides Weasel Platform health status
 *        headers:
 *          Location:
 *            $ref: '#/components/headers/Location'
 */
router.get('/', (req, res) => {
  res.redirect(302, '/platform')
})

/**
 * Placeholder for API URL provided to Weasel Clients.
 *
 * @api [get] /@/:team/:suite
 *    tags:
 *      - Other
 *    summary: 'API URL Placeholder'
 *    operationId: 'misc_placeholder'
 *    description:
 *      Reassures curious engineers who browse to the API URL provided
 *      for submitting results that the Weasel Platform is up and running.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      308:
 *        description:
 *          Path to Weasel Documentations Page served by Web App
 *        headers:
 *          Location:
 *            $ref: '#/components/headers/Location'
 */
router.get('/@/:team/:suite', (req, res) => {
  res.redirect(308, config.webapp.root + '/docs')
})

router.use('/auth', authRouter)
router.use('/batch', batchRouter)
router.use('/client', clientRouter)
router.use('/cmp', comparisonRouter)
router.use('/comment', commentRouter)
router.use('/element', elementRouter)
router.use('/inbox', inboxRouter)
router.use('/platform', platformRouter)
router.use('/suite', suiteRouter)
router.use('/team', teamRouter)
router.use('/user', userRouter)

/**
 * Handles feedback submitted by the user
 *
 * @api [post] /feedback
 *    tags:
 *      - Other
 *    summary: 'Provide Feedback'
 *    operationId: 'other_feedback'
 *    description:
 *      Submits user feedback to Weasel Engineering Team.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - body
 *              - page
 *            properties:
 *              body:
 *                type: string
 *                maxLength: 1024
 *              name:
 *                type: string
 *                maxLength: 64
 *              page:
 *                type: string
 *                maxLength: 16
 *      required: true
 *    responses:
 *      204:
 *        description:
 *          Feedback Delivered
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 */
router.post(
  '/feedback',
  bodyParser.json(),
  middleware.inputs([
    ev
      .body('body')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 1024 })
      .withMessage('too long'),
    ev
      .body('name')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 64 })
      .withMessage('too long'),
    ev
      .body('page')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 16 })
      .withMessage('too long')
      .isSlug()
      .withMessage('invalid')
  ]),
  promisable(feedback, 'handle user feedback')
)

export = router
