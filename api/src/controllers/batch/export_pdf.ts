// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { buildPdfReport } from '@/models/pdf'
import { IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { analytics, EActivity } from '@/utils/tracker'

export async function ctrlBatchExportPDF(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const filename = [team.slug, suite.slug, batch.slug].join('_') + '.pdf'
  logger.debug('%s: exporting %s', user.username, filename)

  if (!batch.sealedAt) {
    return next({ errors: ['batch is not sealed'], status: 400 })
  }

  if (
    !config.aws.accessKeyId ||
    !config.aws.secretAccessKey ||
    !config.aws.lambdaPdf
  ) {
    return next({
      errors: ['not configured to perform this operation'],
      status: 426
    })
  }

  const pdfReport = await buildPdfReport(suite, batch)
  if (!pdfReport) {
    return next({
      errors: ['unexpected response from cloud service'],
      status: 500
    })
  }

  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  res.setHeader('Content-Type', pdfReport.contentType)
  res.writeHead(200)
  res.end(pdfReport.content)
  logger.info('%s: exported %s', user.username, filename)
  analytics.add_activity(EActivity.BatchPDFExported, user, { filename })
}
