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
      name: string
    }[]
    missing: {
      name: string
    }[]
    behavior: {
      cases: {
        name: string
        matchRate: string
      }[]
    }
    duration: {
      value: string
      change: string
      cases: {
        name: string
        value: string
        change: string
      }[]
    }
  }
}

async function buildPageData(suite: ISuiteDocument): Promise<PageData> {
  const content: PageData = {
    suite: {
      name: suite.name
    },
    dstBatch: {
      name: 'vDstBatch'
    },
    srcBatch: {
      name: 'vSrcBatch',
      submittedAt: 'December 23, 2021 at 10:55 PM',
      submittedBy: {
        name: 'Pejman Ghorbanzade'
      },
      fresh: [
        {
          name: 'charli'
        }
      ],
      missing: [
        {
          name: 'charlie'
        }
      ],
      behavior: {
        cases: [
          {
            name: 'alice',
            matchRate: '44.4%'
          }
        ]
      },
      duration: {
        value: '1s 832ms',
        change: 'same as',
        cases: [
          {
            name: 'alice',
            value: '1s 359ms',
            change: ''
          },
          {
            name: 'bob',
            value: '1s 405ms',
            change: '4% slower'
          }
        ]
      }
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
  const content = await buildPageData(suite)
  const template = readFileSync(sample_html_file, 'utf-8')
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
  logger.info('%s: %s: exported as pdf', user.username, tuple)
}
