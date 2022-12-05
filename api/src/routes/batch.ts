// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { batchCompare } from '../controllers/batch/compare.js'
import { ctrlBatchExportPDF } from '../controllers/batch/export_pdf.js'
import { ctrlBatchExportZIP } from '../controllers/batch/export_zip.js'
import { ctrlBatchList } from '../controllers/batch/list.js'
import { ctrlBatchLookup } from '../controllers/batch/lookup.js'
import { ctrlBatchPromote } from '../controllers/batch/promote.js'
import { ctrlBatchRemove } from '../controllers/batch/remove.js'
import { ctrlBatchSeal } from '../controllers/batch/seal.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

const router = express.Router()

router.get(
  '/:team/:suite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  promisable(ctrlBatchList, 'list batches')
)

router.get(
  '/:team/:suite/:batch',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchLookup, 'lookup a batch')
)

router.delete(
  '/:team/:suite/:batch',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchRemove, 'remove a batch')
)

router.post(
  '/:team/:suite/:batch/seal',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
)

router.post(
  '/:team/:suite/:batch/seal2',
  middleware.isClientAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchSeal, 'seal a batch')
)

router.post(
  '/:team/:suite/:batch/promote',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  express.json(),
  middleware.inputs([middleware.validationRules.get('reason')]),
  promisable(ctrlBatchPromote, 'promote a batch')
)

router.get(
  '/:team/:suite/:batch/compare/:dstBatch/:dstSuite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(batchCompare, 'compare a batch')
)

router.get(
  '/:team/:suite/:batch/export/pdf',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchExportPDF, 'export batch results')
)

router.get(
  '/:team/:suite/:batch/export/zip',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  middleware.hasSuite,
  middleware.hasBatch,
  promisable(ctrlBatchExportZIP, 'export batch results')
)

export { router as batchRouter }
