// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import * as bcrypt from 'bcrypt'
import { once } from 'lodash'

import { addSampleData } from '@/models/sampleData'
import { SessionModel } from '@/schemas/session'
import { IUserDocument, UserModel } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import { config } from '@/utils/config'
import * as jwt from '@/utils/jwt'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { tracker, TrackerInfo } from '@/utils/tracker'

/**
 * Find a username that is not already registered.
 */
async function makeUsername(): Promise<string> {
  const random = () => Math.floor(100000 + Math.random() * 900000)
  let slug = `user${random()}`
  while (await UserModel.countDocuments({ slug })) {
    logger.warn('makeUsername() implementation may be inefficient')
    slug = `user${random()}`
  }
  return slug
}

/**
 *
 */
async function getPlatformOwner(): Promise<EPlatformRole> {
  const hasOwner = await UserModel.countDocuments({
    platformRole: EPlatformRole.Owner
  })
  if (!hasOwner) {
    logger.debug('user will be owner of the platform')
    return EPlatformRole.Owner
  }
  return EPlatformRole.User
}

/**
 * Create a new user account or re-uses an existing one.
 */
export async function createUserAccount(
  payload: Partial<TrackerInfo>
): Promise<IUserDocument> {
  const makePass = (length: number) =>
    [...Array(length)].map(() => Math.random().toString(36)[2]).join('')

  // acquire a random username

  const username = await makeUsername()

  // generate password hash
  // we perform this operation after checking if user is registered
  // to avoid paying the cost of hash generation in case they are

  const password = await bcrypt.hash(makePass(16), config.auth.bcryptSaltRound)

  // generate activation key
  // we send this key in the welcome email to the user so we can verify
  // their email address.

  const activationKey = makePass(config.auth.activationKeyLength)

  // the first user who creates an account should be the platform owner.
  // we make this check once per lifetime of this node process.

  const platformRole = await once(getPlatformOwner)()

  // register user in database

  const newUser = await UserModel.create({
    activationKey,
    createdAt: new Date(),
    email: payload.email,
    fullname: payload.name,
    password,
    platformRole,
    username
  })
  logger.info('%s: created account', payload.email)

  // notify user that their user account is created
  // we are intentionally not awaiting on this operation

  const link = `${config.webapp.root}/account/activate?key=${activationKey}`
  mailer.mailUser(newUser, 'Welcome to Touca 👋🏼', 'auth-signup-user', {
    firstName: payload.name ? `, ${payload.name}` : '',
    hasVerificationLink: !payload.name,
    previewMessage: payload.name
      ? "We're excited to have you!"
      : 'Here is your email verification link.',
    verificationLink: link
  })

  // notify platform admins that a new user account was verified.

  mailer.mailAdmins({
    title: 'New Account Created',
    body: `New account created for <b>${username}</b> (<a href="mailto:${payload.email}">${payload.email}</a>).`
  })

  // if configured to do so, create a "tutorial" suite and populate it with
  // sample test results.

  if (config.samples.enabled) {
    addSampleData(newUser)
  } else {
    logger.debug(
      '%s: skipped submission of sample data. feature is disabled.',
      newUser.username
    )
  }

  // add event to tracking system

  tracker
    .create(newUser, {
      avatar: payload.avatar,
      created_at: newUser.createdAt,
      email: payload.email,
      ip_address: payload.ip_address,
      name: payload.name,
      first_name: payload.first_name,
      last_name: payload.last_name,
      user_id: payload.user_id,
      username: payload.username
    })
    .then(() => tracker.track(newUser, 'created_account'))

  return newUser
}

/**
 * Create a new user session or re-uses an existing one.
 */
export async function createUserSession(
  user: IUserDocument,
  options: { askedAgent: string; askedIpAddress: string }
): Promise<{ token: string; expiresAt: Date }> {
  // edge case:
  // if user has an active unexpired session with matching metadata
  // provide the same token that we had provided before.

  const prevSession = await SessionModel.findOne({
    agent: options.askedAgent,
    expiresAt: { $gt: new Date() },
    ipAddr: options.askedIpAddress,
    userId: user._id
  })

  if (prevSession) {
    logger.debug('%s: reusing previously issued token', user.username)
    return { token: jwt.issue(prevSession), expiresAt: prevSession.expiresAt }
  }

  // in the more likely case, when the user had no prior active session
  // with matching metadata, issue a new auth token.

  logger.debug('%s: issuing auth token for user', user.username)

  await UserModel.findByIdAndUpdate(user._id, {
    $unset: { lockedAt: true, loginAttempts: true }
  })

  // set expiration date of the token

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + config.auth.jwtLifetime)

  // add user session to database.

  const session = await SessionModel.create({
    agent: options.askedAgent,
    expiresAt,
    ipAddr: options.askedIpAddress,
    userId: user._id
  })

  // generate a JSON web token

  const token = jwt.issue(session)
  logger.info('%s: issued auth token', user.username)

  return { token, expiresAt }
}
