// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ENotificationType } from '@touca/api-schema'
import mongoose from 'mongoose'

import { compareBatch } from '../models/comparison.js'
import { BatchModel } from '../schemas/batch.js'
import { ComparisonModel } from '../schemas/comparison.js'
import { EReportType, IReportDocument, ReportModel } from '../schemas/report.js'
import { SuiteModel } from '../schemas/suite.js'
import { IUser } from '../schemas/user.js'
import type { BackendBatchComparisonResponse } from '../types/backendtypes.js'
import { config } from '../utils/config.js'
import logger from '../utils/logger.js'
import { mailUser } from '../utils/mailer.js'

type ReportInputsCommon = {
  dstBatchSlug: string
  srcBatchSlug: string
  subject: string
  headerColor: string
  batchLink: string
  teamName: string
  suiteName: string
  batchName: string
  hasComparison: boolean
  username?: string
}

type ReportInputsCompare = {
  hasComparison: boolean
  hasComparisonTable: boolean
  hasDifferentCases: boolean
  hasFreshCases: boolean
  hasMissingCases: boolean
  elementsCountDifferent: number
  elementsCountHead: number
  elementsCountFresh: number
  elementsCountMissing: number
  elementsDifferent: { elementName: string; elementScore: string }[]
  elementsFresh: { elementName: string }[]
  elementsMissing: { elementName: string }[]
  listType: 'complete' | 'partial'
}

type ReportInputsPromote = ReportInputsCommon &
  Partial<ReportInputsCompare> & {
    promotedBy: IUser
    promotedTo: string
    promotedFor: string
  }

type ReportInputsSeal = ReportInputsCommon & Partial<ReportInputsCompare>

type BatchInfo = {
  team: {
    _id: mongoose.Types.ObjectId
    name: string
    slug: string
  }
  suite: {
    _id: mongoose.Types.ObjectId
    name: string
    slug: string
  }
  batch: {
    _id: mongoose.Types.ObjectId
    slug: string
  }
}

type SuiteInfo = {
  promotedAt: Date
  promotedBy: IUser
  promotedFor: string
  promotedTo: string
  subscriptions: { user: IUser; level: ENotificationType }[]
}

async function getSuiteInfo(suiteId: BatchInfo['suite']['_id']) {
  const result: SuiteInfo[] = await SuiteModel.aggregate([
    { $match: { _id: suiteId } },
    {
      $lookup: {
        as: 'subscriptionUsers',
        foreignField: '_id',
        from: 'users',
        localField: 'subscriptions.user'
      }
    },
    {
      $project: {
        _id: 0,
        baseline: { $arrayElemAt: ['$promotions', -1] },
        subscriptions: {
          $map: {
            input: '$subscriptions',
            as: 'item',
            in: {
              user: {
                $arrayElemAt: [
                  {
                    $map: {
                      input: {
                        $filter: {
                          input: '$subscriptionUsers',
                          as: 'usr',
                          cond: {
                            $eq: ['$$usr._id', '$$item.user']
                          }
                        }
                      },
                      as: 'sub',
                      in: {
                        _id: '$$sub._id',
                        email: '$$sub.email',
                        username: '$$sub.username',
                        fullname: '$$sub.fullname'
                      }
                    }
                  },
                  0
                ]
              },
              level: '$$item.level'
            }
          }
        }
      }
    },
    {
      $lookup: {
        as: 'promotedByDoc',
        foreignField: '_id',
        from: 'users',
        localField: 'baseline.by'
      }
    },
    {
      $lookup: {
        as: 'promotedToDoc',
        foreignField: '_id',
        from: 'batches',
        localField: 'baseline.to'
      }
    },
    { $unwind: '$promotedByDoc' },
    { $unwind: '$promotedToDoc' },
    {
      $project: {
        promotedAt: '$baseline.at',
        promotedBy: {
          _id: '$promotedByDoc._id',
          email: '$promotedByDoc.email',
          username: '$promotedByDoc.username',
          fullname: '$promotedByDoc.fullname'
        },
        promotedFor: '$baseline.for',
        promotedTo: '$promotedToDoc.slug',
        subscriptions: 1
      }
    }
  ])
  return result[0]
}

async function getBatchInfo(batchId: IReportDocument['_id']) {
  const result: BatchInfo[] = await BatchModel.aggregate([
    { $match: { _id: batchId } },
    {
      $lookup: {
        as: 'suiteDoc',
        foreignField: '_id',
        from: 'suites',
        localField: 'suite'
      }
    },
    {
      $lookup: {
        as: 'teamDoc',
        foreignField: '_id',
        from: 'teams',
        localField: 'suiteDoc.team'
      }
    },
    { $unwind: '$suiteDoc' },
    { $unwind: '$teamDoc' },
    {
      $project: {
        _id: 0,
        team: {
          _id: '$teamDoc._id',
          name: '$teamDoc.name',
          slug: '$teamDoc.slug'
        },
        suite: {
          _id: '$suiteDoc._id',
          name: '$suiteDoc.name',
          slug: '$suiteDoc.slug'
        },
        batch: {
          _id: '$_id',
          slug: '$slug'
        }
      }
    }
  ])
  return result[0]
}

async function extractComparisonInputs(
  cmp: BackendBatchComparisonResponse
): Promise<ReportInputsCompare> {
  const common = cmp.common
    .filter((e) => e.meta.keysScore !== 1)
    .sort((a, b) => a.meta.keysScore - b.meta.keysScore)
    .map((e) => ({
      elementName: e.src.elementName,
      elementScore: (e.meta.keysScore * 100).toFixed(2)
    }))

  const fresh = cmp.fresh
    .sort((a, b) => a.elementName.localeCompare(b.elementName))
    .map((e) => ({ elementName: e.elementName }))

  const missing = cmp.missing
    .sort((a, b) => a.elementName.localeCompare(b.elementName))
    .map((e) => ({ elementName: e.elementName }))

  return {
    hasComparison: true,
    hasComparisonTable: common.length + missing.length + fresh.length !== 0,
    hasDifferentCases: common.length !== 0,
    hasFreshCases: fresh.length !== 0,
    hasMissingCases: missing.length !== 0,
    elementsCountDifferent: cmp.overview.elementsCountDifferent,
    elementsCountHead: cmp.overview.elementsCountHead,
    elementsCountFresh: cmp.overview.elementsCountFresh,
    elementsCountMissing: cmp.overview.elementsCountMissing,
    elementsDifferent: common.slice(0, 10),
    elementsMissing: missing.slice(0, 5),
    elementsFresh: fresh.slice(0, 5),
    listType:
      common.length < 10 && missing.length < 5 && fresh.length < 5
        ? 'complete'
        : 'partial'
  }
}

async function reportPromotion(
  dstInfo: BatchInfo,
  srcInfo: BatchInfo,
  compareInputs: ReportInputsCompare
): Promise<void> {
  // learn more about this suite including the list of subscribed users

  const suiteInfo = await getSuiteInfo(dstInfo.suite._id)

  const subject = `Baseline of Suite "${dstInfo.suite.slug}" Changed to Version "${dstInfo.batch.slug}"`

  const batchLink = `${config.webapp.root}/~/${dstInfo.team.slug}/${dstInfo.suite.slug}/${dstInfo.batch.slug}`

  let inputs: ReportInputsPromote = {
    dstBatchSlug: dstInfo.batch.slug,
    srcBatchSlug: srcInfo.batch.slug,
    subject,
    headerColor: '#5e6ebf',
    batchLink,
    teamName: srcInfo.team.name,
    suiteName: srcInfo.suite.name,
    batchName: srcInfo.batch.slug,
    hasComparison: false,
    promotedBy: suiteInfo.promotedBy,
    promotedTo: suiteInfo.promotedTo,
    promotedFor: suiteInfo.promotedFor || 'N/A'
  }

  if (!dstInfo.batch._id.equals(srcInfo.batch._id)) {
    inputs = { ...inputs, ...compareInputs }
  }

  // notify all subscribers that this batch has been promoted.
  // since there may be many subscribers, we prefer to send emails in chunks.

  const chunkSize = 5
  for (let i = 0; i < suiteInfo.subscriptions.length; i = i + chunkSize) {
    const jobs = suiteInfo.subscriptions
      .slice(i, i + chunkSize)
      .map(async (subscription) => {
        inputs.username = subscription.user.fullname
        await mailUser(subscription.user, subject, 'batch-promoted', inputs)
      })
    await Promise.all(jobs)
  }
}

async function reportSealed(
  dstInfo: BatchInfo,
  srcInfo: BatchInfo,
  compareInputs: ReportInputsCompare
): Promise<void> {
  // learn more about this suite including the list of subscribed users

  const suiteInfo = await getSuiteInfo(srcInfo.suite._id)

  const subject = compareInputs.hasComparisonTable
    ? `Differences found in version "${srcInfo.batch.slug}" of suite "${srcInfo.suite.slug}"`
    : `New version "${srcInfo.batch.slug}" for suite "${srcInfo.suite.slug}"`

  const batchLink =
    `${config.webapp.root}/~/${srcInfo.team.slug}/` +
    `${srcInfo.suite.slug}/${srcInfo.batch.slug}?cv=${dstInfo.batch.slug}`

  const inputs: ReportInputsSeal = {
    dstBatchSlug: dstInfo.batch.slug,
    srcBatchSlug: srcInfo.batch.slug,
    subject,
    headerColor: compareInputs.hasComparisonTable ? '#7f1d1d' : '#166534',
    batchLink,
    teamName: srcInfo.team.name,
    suiteName: srcInfo.suite.name,
    batchName: srcInfo.batch.slug,
    hasComparison: false,
    ...compareInputs
  }

  // notify all subscribers that this batch has been sealed
  // since there may be many subscribers, we prefer to send emails in chunks

  const chunkSize = 5
  for (let i = 0; i < suiteInfo.subscriptions.length; i = i + chunkSize) {
    const jobs = suiteInfo.subscriptions
      .slice(i, i + chunkSize)
      .filter(
        (subscription) =>
          subscription.level === 'all' || compareInputs.hasComparisonTable
      )
      .map(async (subscription) => {
        inputs.username = subscription.user.fullname
        await mailUser(subscription.user, subject, 'batch-sealed', inputs)
      })
    await Promise.all(jobs)
  }
}

async function processReportJob(job: IReportDocument) {
  const dstInfo = await getBatchInfo(job.dstBatchId)
  const srcInfo = await getBatchInfo(job.srcBatchId)

  const dstTuple = [
    dstInfo.team.slug,
    dstInfo.suite.slug,
    dstInfo.batch.slug
  ].join('/')
  const srcTuple = [
    srcInfo.team.slug,
    srcInfo.suite.slug,
    srcInfo.batch.slug
  ].join('/')
  logger.info(
    'reporting dst %s, src %s (%s)',
    dstTuple,
    srcTuple,
    job.reportType
  )

  // Check that comparison results are available for the two batches.
  // This operation serves two purposes: If the two batches were never
  // compared before, we create comparison jobs for them and ensure that
  // we report only when those jobs are all processed. In case all
  // comparison jobs are processed, we obtain the comparison output
  // for later extraction of information to be used in the report.

  const cmp = await compareBatch(dstInfo.batch._id, srcInfo.batch._id)

  // postpone reporting if there is any pending comparison job

  const hasPendingJobs = await ComparisonModel.countDocuments({
    dstBatchId: dstInfo.batch._id,
    srcBatchId: srcInfo.batch._id,
    processedAt: { $exists: false }
  })

  if (hasPendingJobs) {
    logger.info('reporting dst %s, src %s postponed', dstTuple, srcTuple)
    return
  }

  // extract comparison information

  const compareInputs = await extractComparisonInputs(cmp)

  // send report to all subscribers of this suite

  switch (job.reportType) {
    case EReportType.Promote:
      await reportPromotion(dstInfo, srcInfo, compareInputs)
      break
    case EReportType.Seal:
      await reportSealed(dstInfo, srcInfo, compareInputs)
      break
    default:
      throw new Error('report type not supported')
  }

  // mark report job as processed

  await ReportModel.findByIdAndUpdate(job._id, {
    $set: { reportedAt: new Date() }
  })
}

/**
 * Identifies new batch comparison results and reports them to subscribed
 * users. Responsible for sending batch comparison reports on the platform.
 * This function is meant to be called periodically by the top-level
 * script.
 */
export async function reportingService(): Promise<void> {
  logger.debug('reporting service: running')

  await ReportModel.find({ reportedAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .cursor()
    .eachAsync(processReportJob, { parallel: 5 })
}
