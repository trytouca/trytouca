// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import {
  ctrlCommentCreate,
  ctrlCommentList,
  ctrlCommentRemove,
  ctrlCommentReply,
  ctrlCommentUpdate
} from '../controllers/comment/index.js'
import {
  hasBatch,
  hasComment,
  hasSuite,
  hasTeam,
  isAuthenticated,
  isTeamMember,
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'

const router = express.Router()

router.get(
  '/:team/:suite/:batch/c',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlCommentList, 'list comments')
)

router.post(
  '/:team/:suite/:batch/c',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  express.json(),
  validationRules([validationMap.get('body')]),
  standby(ctrlCommentCreate, 'create comment')
)

router.patch(
  '/:team/:suite/:batch/c/:comment',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  hasComment,
  express.json(),
  validationRules([validationMap.get('body')]),
  standby(ctrlCommentUpdate, 'update comment')
)

router.delete(
  '/:team/:suite/:batch/c/:comment',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  hasComment,
  standby(ctrlCommentRemove, 'remove comment')
)

router.post(
  '/:team/:suite/:batch/c/:comment/reply',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  hasComment,
  express.json(),
  validationRules([validationMap.get('body')]),
  standby(ctrlCommentReply, 'reply to comment')
)

export { router as commentRouter }
