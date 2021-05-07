/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { wslFindByUname, wslGetSuperUser } from '@weasel/models/user'
import { UserModel } from '@weasel/schemas/user'
import { EPlatformRole } from '@weasel/types/commontypes'
import logger from '@weasel/utils/logger'

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
    email: 'noreply@getweasel.com',
    fullname: 'Weasel Platform',
    password: 'supersafehash',
    platformRole: EPlatformRole.Super,
    username: 'weasel'
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
    email: 'anonymous@getweasel.com',
    fullname: 'Former User',
    password: 'supersafehash',
    platformRole: EPlatformRole.User,
    username: 'anonymous'
  })

  logger.info('startup stage: created anonymous user')
  return anonymousUser._id
}
