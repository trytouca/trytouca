// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { readFileSync } from 'fs'
import mustache from 'mustache'
import path from 'path'
import Puppeteer from 'puppeteer'

import { IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'

export async function ctrlBatchExportPDF(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const tuple = [team.slug, suite.slug, batch.slug].join('/')
  const filename = ['touca', suite.slug, batch.slug].join('_') + '.pdf'
  logger.debug('%s: %s: exporting as pdf', user.username, tuple)

  if (!batch.sealedAt) {
    return next({ errors: ['batch is not sealed'], status: 400 })
  }

  const sample_html_file = path.join(
    config.mail.templatesDirectory,
    'reports',
    'sample.html'
  )
  const pageData = { content: 'Sample Content Here' }
  const template = readFileSync(sample_html_file, 'utf-8')
  const bodyHtml = mustache.render(template, pageData)

  const browser = await Puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(bodyHtml)
  const buffer = await page.pdf()
  await browser.close()

  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  res.setHeader('Content-Type', 'application/pdf')
  res.writeHead(200)
  res.end(buffer)
  logger.info('%s: %s: exported as pdf', user.username, tuple)
}
