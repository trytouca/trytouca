/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import { batchPromote, batchSeal } from '../../models/batch'
import { BatchModel } from '../../schemas/batch'
import { ISuiteDocument, SuiteModel } from '../../schemas/suite'
import { ITeam } from '../../schemas/team'
import { IUser } from '../../schemas/user'
import logger from '../../utils/logger'
import { config } from '../../utils/config'
import { rclient } from '../../utils/redis'
import { processBinaryContent } from '../client/submit'
import fs from 'fs'
import path from 'path'

/**
 * Add sample test results to an empty suite.
 */
export async function ctrlSuitePopulate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: asking to submit sample data to %s', user.username, tuple)

  // reject request if suite already has data

  if (await BatchModel.countDocuments({ suite: suite._id })) {
    return next({
      errors: ['suite not empty'],
      status: 409
    })
  }

  // reject request if samples directory not found

  if (!fs.existsSync(config.results.samplesDirectory)) {
    logger.error('samples directory not found')
    return res.status(500).send()
  }

  const samples = fs
    .readdirSync(config.results.samplesDirectory)
    .map((filename) => path.join(config.results.samplesDirectory, filename))
    .filter((file) => fs.statSync(file).isFile())
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))

  // proceed with submission of sample test results to this suite.

  logger.info('%s: submitting sample data to %s', tuple, user.username)
  const batchBaseline = 'v2.0' // batch to be baseline of the suite
  let suiteUpdated = suite
  for (const sample of samples) {
    const content = fs.readFileSync(sample)
    const errors = await processBinaryContent(user, content, {
      override: {
        teamSlug: team.slug,
        suiteSlug: suite.slug
      }
    })
    if (errors.length !== 0) {
      errors.forEach((e) =>
        logger.warn('%s: failed to submit sample data %s', user.username, e)
      )
      return next({
        errors,
        status: 500
      })
    }
    suiteUpdated = await SuiteModel.findById(suite._id)
    const batchSlug = path.parse(sample).name
    const batch = await BatchModel.findOne({ slug: batchSlug })
    await batchSeal(team, suiteUpdated, batch, { reportJob: false })
    if (batchSlug === batchBaseline) {
      const reason =
        'Once you inspected differences found in a given version, ' +
        'you can set that version as the new baseline, so that ' +
        'future versions are compared against it.'
      await batchPromote(team, suiteUpdated, batch, user, reason, {
        reportJob: false
      })
      suiteUpdated = await SuiteModel.findById(suite._id)
    }
  }

  // at this point, it is likely that newly submitted batches have pending
  // comparison jobs and, therefore, are shown with a spinning icon in the
  // user interface. Since processing these jobs is asyncroneous, it may
  // happen after we have cached the response to the first request for the
  // list of batches. To minimize the time that we show batches as
  // "in progress", we set timers to remove this cached response every five
  // seconds.

  for (let i = 1; i <= 6; i++) {
    const keys = [
      `route_batchList_${team.slug}_${suite.slug}_${user.username}`,
      `route_suiteLookup_${team.slug}_${suite.slug}`
    ]
    setTimeout(() => keys.forEach((key) => rclient.removeCached(key)), i * 5000)
  }

  logger.info('%s: populated suite %s with sample data', user.username, tuple)
  return res.status(204).send()
}
