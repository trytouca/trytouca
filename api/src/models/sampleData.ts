// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import fs from 'fs'
import path from 'path'

import { processBinaryContent } from '@/controllers/client/submit'
import { batchPromote, batchSeal } from '@/models/batch'
import { suiteCreate } from '@/models/suite'
import { teamCreate } from '@/models/team'
import { BatchModel } from '@/schemas/batch'
import { SuiteModel } from '@/schemas/suite'
import { ITeam, TeamModel } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'

/**
 * Find a team slug that is not already registered.
 */
async function findTeamSlug() {
  const random = () => Math.floor(100000 + Math.random() * 900000)
  let slug = `tutorial-${random()}`
  while (await TeamModel.countDocuments({ slug })) {
    logger.warn('findTeamSlug() implementation may be inefficient')
    slug = `tutorial-${random()}`
  }
  return slug
}

/**
 * Add sample test results to an empty suite.
 *
 * Most newly registered users may not be willing to take the time to
 * integrate our SDKs with their regression test tools to submit test results.
 * They want to see how Touca could help their development process prior to
 * learning how to use it. To help these users, we create a team and suite for
 * the new user and auto-populate the suite with sample data. This allows users
 * to play around and tinker with the platform capabilities prior to submitting
 * results on their own.
 */
export async function addSampleData(user: IUser, team?: ITeam): Promise<void> {
  if (!team) {
    team = await teamCreate(user, {
      slug: await findTeamSlug(),
      name: 'Tutorial'
    })
  }
  let suite = await suiteCreate(user, team, {
    slug: 'students',
    name: 'Students'
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

    // seal this batch

    // note that we are refreshing the `suite` object to make sure its
    // `promotions` field is up-to-date when it is passed to the `batchSeal`
    // function.

    suite = await SuiteModel.findById(suite._id)
    const batchSlug = path.parse(sample).name
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
    setTimeout(() => keys.forEach((key) => rclient.removeCached(key)), i * 5000)
  }

  logger.info('%s: submitted sample data to %s', user.username, tuple)
}
