// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { batchCompare } from '@/controllers/batch/compare'
import { ctrlBatchExportPDF } from '@/controllers/batch/export_pdf'
import { ctrlBatchExportZIP } from '@/controllers/batch/export_zip'
import { ctrlBatchList } from '@/controllers/batch/list'
import { ctrlBatchLookup } from '@/controllers/batch/lookup'
import { ctrlBatchPromote } from '@/controllers/batch/promote'
import { ctrlBatchRemove } from '@/controllers/batch/remove'
import { ctrlBatchSeal } from '@/controllers/batch/seal'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

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
