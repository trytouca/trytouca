// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

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
  isTeamAdmin,
  isTeamMember,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { handleEvents, promisable } from '../utils/index.js'

const router = Router()

router.get(
  '/:team/:suite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  promisable(ctrlBatchList, 'list batches')
)

router.get(
  '/:team/:suite/:batch',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchLookup, 'lookup a batch')
)

router.delete(
  '/:team/:suite/:batch',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchRemove, 'remove a batch')
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
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
)

router.post(
  '/:team/:suite/:batch/seal2',
  isClientAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
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
  promisable(ctrlBatchPromote, 'promote a batch')
)

router.get(
  '/:team/:suite/:batch/compare/:dstBatch/:dstSuite',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(batchCompare, 'compare a batch')
)

router.get(
  '/:team/:suite/:batch/export/pdf',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchExportPDF, 'export batch results')
)

router.get(
  '/:team/:suite/:batch/export/zip',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  hasSuite,
  hasBatch,
  promisable(ctrlBatchExportZIP, 'export batch results')
)

export { router as batchRouter }
