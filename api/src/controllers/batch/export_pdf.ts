// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { readFileSync } from 'fs'
import mustache from 'mustache'
import path from 'path'
import Puppeteer from 'puppeteer'

import { ComparisonFunctions } from '@/controllers/comparison'
import { UserMap } from '@/models/usermap'
import { BatchModel, IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'

interface PageData {
  suite: {
    name: string
  }
  dstBatch: {
    name: string
  }
  srcBatch: {
    name: string
    submittedAt: string
    submittedBy: {
      name: string
    }
    fresh: {
      hasCases: boolean
      cases: {
        name: string
      }[]
    }
    missing: {
      hasCases: boolean
      cases: {
        name: string
      }[]
    }
    behavior: {
      hasCases: boolean
      cases: {
        name: string
        matchRate: string
      }[]
    }
    duration: {
      value: string
      change: string
      hasCases: boolean
      cases: {
        name: string
        value: string
        change: string
      }[]
    }
  }
}

async function buildPageData(
  suite: ISuiteDocument,
  srcBatch: IBatchDocument
): Promise<PageData> {
  const userMap = await new UserMap()
    .addGroup('submittedBy', srcBatch.submittedBy)
    .populate()
  const submittedAt = srcBatch.submittedAt.toLocaleString('en-US', {
    dateStyle: 'full',
    timeZone: 'UTC',
    timeStyle: 'long'
  })
  const submittedBy = {
    name: userMap
      .getGroup('submittedBy')
      .map((v) => v.fullname)
      .join(' and ')
  }
  const dstBatch = await BatchModel.findOne(
    { _id: suite.promotions[suite.promotions.length - 1].to },
    { _id: 1, slug: 1 }
  )
  const cmpOutput = await ComparisonFunctions.compareBatch(
    dstBatch._id,
    srcBatch._id
  )
  const differentCases = cmpOutput.common.filter((v) => v.meta.keysScore !== 1)
  const behavior = {
    hasCases: differentCases.length !== 0,
    cases: differentCases.map((v) => ({
      name: v.src.elementName,
      matchRate: Math.floor(v.meta.keysScore * 100).toString() + '%'
    }))
  }
  const duration = {
    value: cmpOutput.overview.metricsDurationHead.toString(),
    change: cmpOutput.overview.metricsDurationChange.toString(),
    hasCases: cmpOutput.common.length !== 0,
    cases: cmpOutput.common.map((v) => ({
      name: v.src.elementName,
      value: v.meta.metricsDurationCommonSrc.toString(),
      change:
        (
          ((v.meta.metricsDurationCommonSrc - v.meta.metricsDurationCommonDst) /
            v.meta.metricsDurationCommonDst) *
          100
        ).toFixed(2) + '%'
    }))
  }
  const fresh = {
    hasCases: cmpOutput.fresh.length !== 0,
    cases: cmpOutput.fresh.map((v) => ({ name: v.elementName }))
  }
  const missing = {
    hasCases: cmpOutput.missing.length !== 0,
    cases: cmpOutput.missing.map((v) => ({ name: v.elementName }))
  }
  const content: PageData = {
    suite: {
      name: suite.name
    },
    dstBatch: {
      name: dstBatch.slug
    },
    srcBatch: {
      name: srcBatch.slug,
      submittedAt,
      submittedBy,
      behavior,
      duration,
      fresh,
      missing
    }
  }
  return content
}

export async function ctrlBatchExportPDF(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const filename = ['touca', suite.slug, batch.slug].join('_') + '.pdf'
  logger.debug('%s: exporting %s', user.username, filename)

  if (!batch.sealedAt) {
    return next({ errors: ['batch is not sealed'], status: 400 })
  }

  const content = await buildPageData(suite, batch)
  const template_file = path.join(
    config.mail.templatesDirectory,
    'reports',
    'report.html'
  )
  const template = readFileSync(template_file, 'utf-8')
  const bodyHtml = mustache.render(template, { content })

  const browser = await Puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(bodyHtml)
  const buffer = await page.pdf()
  await browser.close()

  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  res.setHeader('Content-Type', 'application/pdf')
  res.writeHead(200)
  res.end(buffer)
  logger.info('%s: %s: exported %s', user.username, filename)
}
