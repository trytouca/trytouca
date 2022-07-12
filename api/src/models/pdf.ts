// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { InvokeCommand, Lambda } from '@aws-sdk/client-lambda'
import { readFileSync } from 'fs'
import mustache from 'mustache'
import path from 'path'

import { ComparisonFunctions } from '@/controllers/comparison'
import { UserMap } from '@/models/usermap'
import { BatchModel, IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { config } from '@/utils/config'

interface PdfContent {
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
        row: number
        name: string
        matchRate: {
          color: string
          text: string
        }
      }[]
    }
    duration: {
      value: string
      change: {
        icon: string
        color: string
        text: string
      }
      hasCases: boolean
      cases: {
        row: number
        name: string
        value: string
        change: {
          icon: string
          color: string
          text: string
        }
      }[]
    }
  }
}

interface PdfReport {
  content: Buffer
  contentType: string
  contentDisposition: string
  filename: string
}

async function buildPdfContent(
  suite: ISuiteDocument,
  srcBatch: IBatchDocument
): Promise<PdfContent> {
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
  const toSeconds = (duration: number) => (duration / 1000).toFixed(1) + ' s'
  const toDurationChange = (change: number) => {
    const value = Math.abs(change).toFixed()
    return {
      icon: change > 0 ? 'trending-up' : 'trending-down',
      color:
        change > 0
          ? 'dark:text-red-500 text-red-600 bg-red-100'
          : 'dark:text-green-500 text-green-600 bg-green-100',
      suffix: change > 0 ? 'slower' : 'faster',
      text: `${value}%`
    }
  }
  const behavior = {
    hasCases: differentCases.length !== 0,
    cases: differentCases.map((v, index) => ({
      row: index + 1,
      name: v.src.elementName,
      matchRate: {
        color: v.meta.keysScore > 0.8 ? 'text-yellow-600' : 'text-red-600',
        text: Math.floor(v.meta.keysScore * 100).toString() + '%'
      }
    }))
  }
  const duration = {
    value: toSeconds(cmpOutput.overview.metricsDurationHead),
    change: toDurationChange(cmpOutput.overview.metricsDurationChange),
    hasCases: cmpOutput.common.length !== 0,
    cases: cmpOutput.common.map((v, index) => ({
      row: index + 1,
      name: v.src.elementName,
      value: toSeconds(v.meta.metricsDurationCommonSrc),
      change: toDurationChange(
        ((v.meta.metricsDurationCommonSrc - v.meta.metricsDurationCommonDst) /
          v.meta.metricsDurationCommonDst) *
          100
      )
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
  const content: PdfContent = {
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

export async function buildPdfReport(
  suite: ISuiteDocument,
  batch: IBatchDocument
): Promise<PdfReport> {
  const content = await buildPdfContent(suite, batch)
  const template_file = path.join(
    config.mail.templatesDirectory,
    'reports',
    'report.html'
  )
  const template = readFileSync(template_file, 'utf-8')
  const html = mustache.render(template, { content })

  const lambda = new Lambda({
    region: config.aws.region
  })
  const response = await lambda.send(
    new InvokeCommand({
      FunctionName: config.aws.lambdaPdf,
      Payload: Buffer.from(JSON.stringify({ html }))
    })
  )

  if (response.StatusCode !== 200) {
    return
  }

  const responseBody = JSON.parse(response.Payload.toString()).body
  return {
    content: Buffer.from(responseBody, 'base64'),
    contentType: 'application/pdf',
    contentDisposition: 'attachment',
    filename: [suite.slug, batch.slug].join('_') + '.pdf'
  }
}
