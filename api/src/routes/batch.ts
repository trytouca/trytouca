// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { json, Router } from 'express'

import { batchCompare } from '../controllers/batch/index.js'
import {
  ctrlBatchExportPDF,
  ctrlBatchExportZIP,
  ctrlBatchList,
  ctrlBatchLookup,
  ctrlBatchPromote,
  ctrlBatchRemove,
  ctrlBatchSeal
} from '../controllers/batch/index.js'
import {
  hasBatch,
  hasSuite,
  hasTeam,
  isAuthenticated,
  isClientAuthenticated,
  isClientOrUserAuthenticated,
  isTeamAdmin,
  isTeamMember,
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { handleEvents } from '../utils/index.js'

const router = Router()

router.get(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  standby(ctrlBatchList, 'list batches')
)

router.get(
  '/:team/:suite/:batch',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchLookup, 'lookup a batch')
)

router.delete(
  '/:team/:suite/:batch',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasSuite,
  hasBatch,
  standby(ctrlBatchRemove, 'remove a batch')
)

router.get(
  '/:team/:suite/:batch/events',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  handleEvents
)

router.post(
  '/:team/:suite/:batch/seal',
  isClientOrUserAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchSeal, 'seal a batch')
)

/**
 * Deprecated in favor of `/batch/:team/:suite/:batch/seal`.
 * Kept for backward compatibility.
 */
router.post(
  '/:team/:suite/:batch/seal2',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchSeal, 'seal a batch')
)

router.post(
  '/:team/:suite/:batch/promote',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  json(),
  validationRules([validationMap.get('reason')]),
  standby(ctrlBatchPromote, 'promote a batch')
)

router.get(
  '/:team/:suite/:batch/compare/:dstBatch/:dstSuite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(batchCompare, 'compare a batch')
)

router.get(
  '/:team/:suite/:batch/export/pdf',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchExportPDF, 'export batch results')
)

router.get(
  '/:team/:suite/:batch/export/zip',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  standby(ctrlBatchExportZIP, 'export batch results')
)

export { router as batchRouter }
