// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'
import * as ev from 'express-validator'

import {
  elementCompare,
  elementFile,
  elementList,
  elementLookup,
  elementUpdate
} from '../controllers/element/index.js'
import {
  hasArtifact,
  hasBatch,
  hasElement,
  hasSuite,
  hasTeam,
  isAuthenticated,
  isTeamMember,
  standby,
  validationRules
} from '../middlewares/index.js'

const router = express.Router()

router.get(
  '/v2/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  standby(elementList, 'list suite elements')
)

router.get(
  '/:team/:suite/:element',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasElement,
  standby(elementLookup, 'lookup an element')
)

router.patch(
  '/:team/:suite/:element',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasElement,
  express.json(),
  validationRules([
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
  standby(elementUpdate, 'update a test case')
)

router.get(
  '/:team/:suite/:element/compare/:batch/:dstBatch/:dstElement/:dstSuite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasElement,
  hasBatch,
  standby(elementCompare, 'compare an element')
)

router.get(
  '/:team/:suite/:element/artifact/:batch/:artifact',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasElement,
  hasBatch,
  hasArtifact,
  standby(elementFile, 'fetch an artifact')
)

export { router as elementRouter }
