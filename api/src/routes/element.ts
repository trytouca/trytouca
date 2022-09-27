// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import { elementCompare } from '@/controllers/element/compare'
import { elementFile } from '@/controllers/element/file'
import { elementList } from '@/controllers/element/list'
import { elementLookup } from '@/controllers/element/lookup'
import { elementUpdate } from '@/controllers/element/update'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

/**
 * Deprecated in favor of `/client/element/:team/:suite`.
 * Kept for backward compatibility.
 */
router.get(
  '/:team/:suite',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(elementList, 'list suite elements')
)

router.get(
  '/v2/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(elementList, 'list suite elements')
)

router.get(
  '/:team/:suite/:element',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasElement,
  promisable(elementLookup, 'lookup an element')
)

router.patch(
  '/:team/:suite/:element',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasElement,
  express.json(),
  middleware.inputs([
    ev
      .body('note')
      .isString()
      .withMessage('not a string')
      .withMessage('invalid')
      .optional(),
    ev
      .body('tags')
      .isArray()
      .withMessage('not an array')
      .withMessage('invalid')
      .optional()
  ]),
  promisable(elementUpdate, 'update a test case')
)

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

router.get(
  '/:team/:suite/:element/artifact/:batch/:artifact',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasElement,
  middleware.hasBatch,
  middleware.hasArtifact,
  promisable(elementFile, 'fetch an artifact')
)

export { router as elementRouter }
