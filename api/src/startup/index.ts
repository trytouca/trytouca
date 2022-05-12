// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { wslFindByUname, wslGetSuperUser } from '@/models/user'
import { SuiteModel } from '@/schemas/suite'
import { UserModel } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import logger from '@/utils/logger'

/**
 * Registers primary user during server startup.
 * Defining such user helps send notifications to other users
 * on behalf of the platform.
 */
export async function setupSuperuser() {
  // check if user is already registered in the database

  const user = await wslGetSuperUser()
  if (user) {
    return user._id
  }

  // otherwise register the user in the database

  const superuser = await UserModel.create({
    email: 'noreply@touca.io',
    fullname: 'Touca',
    password: 'supersafehash',
    platformRole: EPlatformRole.Super,
    username: 'touca'
  })

  logger.info('startup stage: created superuser')
  return superuser._id
}

/**
 * Register a special "anonymous" user during server startup.
 * When a user removes their account, their activities such as their comments,
 * promotions, submissions etc will be assigned to this special user account.
 */
export async function setupAnonymousUser() {
  // check if user is already registered in the database

  const user = await wslFindByUname('anonymous')
  if (user) {
    return user._id
  }

  // otherwise register the user in the database

  const anonymousUser = await UserModel.create({
    email: 'anonymous@touca.io',
    fullname: 'Former User',
    password: 'supersafehash',
    platformRole: EPlatformRole.User,
    username: 'anonymous'
  })

  logger.info('startup stage: created anonymous user')
  return anonymousUser._id
}

// In January 2022, we allowed users to control level of notification when
// subscribing to suites. The original `subscribers` field in the `Suite`
// collection, defined as an array of user IDs is no longer relevant and is
// now replaced with `subscriptions`.
async function upgradeSuiteSubscriptions() {
  const suites = await SuiteModel.find(
    { subscribers: { $exists: true, $type: 'array', $ne: [] } },
    { subscribers: 1 }
  )
  if (suites.length === 0) {
    return
  }
  for (const suite of suites) {
    await SuiteModel.findByIdAndUpdate(suite._id, {
      $set: {
        subscriptions: suite.subscribers.map((k) => ({
          user: k,
          level: 'all'
        }))
      },
      $unset: { subscribers: true }
    })
  }
  logger.info('upgraded subscribers fields in %d suites', suites.length)
}

export async function upgradeDatabase() {
  logger.info('database migration: performing checks')
  await upgradeSuiteSubscriptions()
  logger.info('database migration: checks completed')
  return true
}
