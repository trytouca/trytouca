// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { ctrlCommentCreate } from '@/controllers/comment/create'
import { ctrlCommentList } from '@/controllers/comment/list'
import { ctrlCommentRemove } from '@/controllers/comment/remove'
import { ctrlCommentReply } from '@/controllers/comment/reply'
import { ctrlCommentUpdate } from '@/controllers/comment/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.get(
  '/:team/:suite/:batch/c',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlCommentList, 'list comments')
)

router.post(
  '/:team/:suite/:batch/c',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  express.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentCreate, 'create comment')
)

router.patch(
  '/:team/:suite/:batch/c/:comment',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  middleware.hasComment,
  express.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentUpdate, 'update comment')
)

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

router.post(
  '/:team/:suite/:batch/c/:comment/reply',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  middleware.hasComment,
  express.json(),
  middleware.inputs([middleware.validationRules.get('body')]),
  promisable(ctrlCommentReply, 'reply to comment')
)

export { router as commentRouter }
