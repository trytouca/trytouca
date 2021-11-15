// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { feedback } from '@/controllers/misc/feedback'
import * as middleware from '@/middlewares'
import { authRouter } from '@/routes/auth'
import { batchRouter } from '@/routes/batch'
import { clientRouter } from '@/routes/client'
import { commentRouter } from '@/routes/comment'
import { comparisonRouter } from '@/routes/comparison'
import { elementRouter } from '@/routes/element'
import { inboxRouter } from '@/routes/inbox'
import { platformRouter } from '@/routes/platform'
import { suiteRouter } from '@/routes/suite'
import { teamRouter } from '@/routes/team'
import { userRouter } from '@/routes/user'
import { promisable } from '@/utils/routing'

const router = express.Router()

/**
 * API Entry-point
 *
 * @api [get] /
 *    tags:
 *      - Other
 *    summary: 'Entry-point'
 *    operationId: 'misc_index'
 *    description:
 *      Reassures curious engineers who browse to the Backend URL that
 *      the server is up and running.
 *    responses:
 *      302:
 *        description:
 *          Path to route that provides server health status
 *        headers:
 *          Location:
 *            $ref: '#/components/headers/Location'
 */
router.get('/', (req, res) => {
  res.redirect(302, '/platform')
})

/**
 * Placeholder for API URL provided to Touca Clients.
 *
 * @api [get] /@/:team/:suite
 *    tags:
 *      - Other
 *    summary: 'API URL Placeholder'
 *    operationId: 'misc_placeholder'
 *    description:
 *      Reassures curious engineers who browse to the API URL provided
 *      for submitting results that the platform is up and running.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *    responses:
 *      308:
 *        description:
 *          Path to the Documentations Page served by Web App
 *        headers:
 *          Location:
 *            $ref: '#/components/headers/Location'
 */
router.get('/@/:team/:suite', (req, res) => {
  res.redirect(308, 'https://docs.touca.io')
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
 *      Submits user feedback to Touca Engineering Team.
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
 *                minLength: 20
 *                maxLength: 1000
 *              name:
 *                type: string
 *                maxLength: 100
 *              page:
 *                type: string
 *                maxLength: 16
 *              email:
 *                type: string
 *                maxLength: 100
 *              cname:
 *                type: string
 *                maxLength: 100
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
  express.json(),
  middleware.inputs([
    ev
      .body('body')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 1000 })
      .withMessage('too long')
      .isLength({ min: 20 })
      .withMessage('too short'),
    ev
      .body('name')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 100 })
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
      .withMessage('invalid'),
    ev
      .body('email')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isEmail()
      .withMessage('must be an email')
      .isLength({ max: 100 })
      .withMessage('too long'),
    ev
      .body('cname')
      .optional()
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 100 })
      .withMessage('too long')
  ]),
  promisable(feedback, 'handle user feedback')
)

export = router
