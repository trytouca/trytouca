// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, parse } from 'node:path'

import { BatchModel } from '../schemas/batch.js'
import { SuiteModel } from '../schemas/suite.js'
import { ITeam, TeamModel } from '../schemas/team.js'
import { UserModel } from '../schemas/user.js'
import { config } from '../utils/config.js'
import logger from '../utils/logger.js'
import { redisClient } from '../utils/redis.js'
import { batchPromote, batchSeal } from './batch.js'
import { processBinaryContent } from './submit.js'
import { suiteCreate } from './suite.js'

/**
 * Add sample test results to an empty suite.
 *
 * Most newly registered users may not be willing to take the time to
 * integrate our SDKs with their regression test tools to submit test results.
 * They want to see how Touca could help their development process prior to
 * learning how to use it. To help these users, we create a team and suite for
 * the new user and auto-populate the suite with sample data. This allows users
 * to play around and tinker with the server prior to submitting results on
 * their own.
 */
export async function addSampleData(team: ITeam): Promise<void> {
  const owner = await TeamModel.findById(team._id, { owner: 1 })
  const user = await UserModel.findById(owner.owner)

  let suite = await suiteCreate(user, team, {
    slug: 'students',
    name: 'Students'
  })

  const tuple = [team.slug, suite.slug].join('/')
  logger.debug('%s: submitting sample data to %s', user.username, tuple)

  // reject request if samples directory not found

  if (!existsSync(config.samples.directory)) {
    logger.error('samples directory not found')
    return
  }

  const samples = readdirSync(config.samples.directory)
    .map((filename) => join(config.samples.directory, filename))
    .filter((file) => statSync(file).isFile())
    .sort((a, b) => basename(a).localeCompare(basename(b)))

  // proceed with submission of sample test results to this suite.

  logger.info('%s: submitting sample data to %s', tuple, user.username)
  const batchBaseline = 'v2.0' // batch to be baseline of the suite
  for (const sample of samples) {
    const content = readFileSync(sample)
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

    // seal this batch

    // note that we are refreshing the `suite` object to make sure its
    // `promotions` field is up-to-date when it is passed to the `batchSeal`
    // function.

    suite = await SuiteModel.findById(suite._id)
    const batchSlug = parse(sample).name
    const batch = await BatchModel.findOne({
      suite: suite._id,
      slug: batchSlug
    })
    await batchSeal(team, suite, batch, { reportJob: false })

    // promote this batch if it should be the eventual baseline

    // note that in the below impl, we are not refreshing the `batch` object.
    // to reflect that it is now sealed. we are assuming that `batchPromote`
    // does not care whether the batch is sealed.

    if (batchSlug === batchBaseline) {
      const reason =
        'Once you inspected differences found in a given version, ' +
        'you can set that version as the new baseline, so that ' +
        'future versions are compared against it.'
      await batchPromote(team, suite, batch, user, reason, {
        reportJob: false
      })
      suite = await SuiteModel.findById(suite._id)
    }
  }

  // at this point, it is likely that newly submitted batches have pending
  // comparison jobs and, therefore, are shown with a spinning icon in the
  // user interface. Since processing these jobs is asynchronous, it may
  // happen after we have cached the response to the first request for the
  // list of batches. To minimize the time that we show batches as
  // "in progress", we set timers to remove this cached response every five
  // seconds.

  for (let i = 3; i <= 6; i++) {
    const keys = [
      `route_batchList_${team.slug}_${suite.slug}_${user.username}`,
      `route_suiteLookup_${team.slug}_${suite.slug}`
    ]
    setTimeout(
      () => keys.forEach((key) => redisClient.removeCached(key)),
      i * 5000
    )
  }

  logger.info('%s: submitted sample data to %s', user.username, tuple)
}
