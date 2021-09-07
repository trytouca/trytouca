// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import bodyParser from 'body-parser'
import e from 'express'

import { ctrlCommentCreate } from '@/controllers/comment/create'
import { ctrlCommentList } from '@/controllers/comment/list'
import { ctrlCommentRemove } from '@/controllers/comment/remove'
import { ctrlCommentReply } from '@/controllers/comment/reply'
import { ctrlCommentUpdate } from '@/controllers/comment/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = e.Router()

/**
 * List comments submitted for a given page.
 *
 * @api [get] /comment/:team/:suite/:batch/c
 *    tags:
 *      - Comment
 *    summary: 'List Comments'
 *    operationId: 'comment_list'
 *    description:
 *      List comments submitted for a given page.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *    responses:
 *      200:
 *        description: 'List of Comments'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_CommentListResponse'
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
  '/:team/:suite/:batch/c',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlCommentList, 'list comments')
)

/**
 * Creates a new comment.
 *
 * @api [post] /comment/:team/:suite/:batch/c
 *    tags:
 *      - Comment
 *    summary: 'Create Comment'
 *    operationId: 'comment_create'
 *    description:
 *      Creates a new comment.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
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
 *              - body
 *            properties:
 *              body:
 *                type: string
 *                minLength: 10
 *                maxLength: 1500
 *      required: true
 *    responses:
 *      204:
 *        description: 'Comment created'
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
  '/:team/:suite/:batch/c',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  bodyParser.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentCreate, 'create comment')
)

/**
 * Update an existing comment.
 *
 * @api [patch] /comment/:team/:suite/:batch/c/:comment
 *    tags:
 *      - Comment
 *    summary: 'Update Comment'
 *    operationId: 'comment_update'
 *    description:
 *      Updates an existing comment.
 *      User performing the request must be authenticated.
 *      User performing the request must be member of the team.
 *      User performing the request must own the comment.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *      - $ref: '#/components/parameters/comment'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - body
 *            properties:
 *              body:
 *                type: string
 *                minLength: 10
 *                maxLength: 1500
 *      required: true
 *    responses:
 *      204:
 *        description: 'Comment updated'
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
router.patch(
  '/:team/:suite/:batch/c/:comment',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  middleware.hasComment,
  bodyParser.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentUpdate, 'update comment')
)

/**
 * Removes an existing comment.
 *
 * @api [delete] /comment/:team/:suite/:batch/c/:comment
 *    tags:
 *      - Comment
 *    summary: 'Remove Comment'
 *    operationId: 'comment_remove'
 *    description:
 *      Removes an existing comment.
 *      User performing the request must be authenticated.
 *      User performing the request must be member of the team.
 *      User performing the request must be owner of the comment
 *      or admin of the team or admin of the platform.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *      - $ref: '#/components/parameters/comment'
 *    responses:
 *      204:
 *        description: 'Comment removed'
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
  '/:team/:suite/:batch/c/:comment',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  middleware.hasComment,
  promisable(ctrlCommentRemove, 'remove comment')
)

/**
 * Reply to a comment.
 *
 * @api [post] /comment/:team/:suite/:batch/c/:comment/reply
 *    tags:
 *      - Comment
 *    summary: 'Reply to Comment'
 *    operationId: 'comment_reply'
 *    description:
 *      Replies to an existing comment.
 *      User performing the request must be authenticated.
 *      User performing the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/suite'
 *      - $ref: '#/components/parameters/batch'
 *      - $ref: '#/components/parameters/comment'
 *    responses:
 *      204:
 *        description: 'Comment reply submitted'
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
  '/:team/:suite/:batch/c/:comment/reply',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  middleware.hasComment,
  bodyParser.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentReply, 'reply to comment')
)

export const commentRouter = router
