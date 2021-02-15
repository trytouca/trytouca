/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import fs from 'fs'
import path from 'path'
import { processBinaryContent } from '../controllers/client/submit'
import { BatchModel } from '../schemas/batch'
import { SuiteModel } from '../schemas/suite'
import { IUser } from '../schemas/user'
import { config } from '../utils/config'
import { rclient } from '../utils/redis'
import logger from '../utils/logger'
import { batchPromote, batchSeal } from './batch'
import { suiteCreate } from './suite'
import { teamCreate } from './team'

/**
 * Add sample test results to an empty suite.
 *
 * we acknowledge that most newly registered users may not find incentive
 * to take the time to integrate our libraries with their regression test
 * tools to submit test results. they may like to learn how the platform
 * may help their development process prior to learning how to use it.
 * To help these users, we create a random team and suite for the new user
 * and auto-populate the suite with sample data. This allows users to play
 * around and tinker with the platform capabilities prior to submitting
 * results on their own.
 */
export async function addSampleData(user: IUser): Promise<void> {
  const random = Math.floor(1000 + Math.random() * 9000)
  const team = await teamCreate(user, {
    slug: `tutorial-${random}`,
    name: 'Tutorial'
  })
  const suite = await suiteCreate(user, team, {
    slug: 'profile-db',
    name: 'Profile Database'
  })

  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: submitting sample data to %s', user.username, tuple)

  // reject request if samples directory not found

  if (!fs.existsSync(config.samples.directory)) {
    logger.error('samples directory not found')
    return
  }

  const samples = fs
    .readdirSync(config.samples.directory)
    .map((filename) => path.join(config.samples.directory, filename))
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
    errors.forEach((e) =>
      logger.warn('%s: failed to submit to %s: %s', user.username, tuple, e)
    )
    if (errors.length !== 0) {
      return
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

  logger.info('%s: submitted sample data to %s', user.username, tuple)
}
