/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { addSampleData } from '@weasel/models/sampleData'
import { UserModel } from '@weasel/schemas/user'
import { EPlatformRole } from '@weasel/types/commontypes'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'
import { tracker } from '@weasel/utils/tracker'
import * as bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { once } from 'lodash'

/**
 * Find a username that is not already registered.
 */
async function makeUsername() {
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
async function getPlatformOwner() {
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
 *
 */
export async function authVerifyCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedEmail = (req.body.email as string).toLowerCase()
  const askedIpAddress = req.ip

  // return 400 if email is already associated with any user
  // important not to use any of the static helper functions of user schema
  // here since we like to include suspended accounts in our check.

  if (await UserModel.countDocuments({ email: askedEmail })) {
    return next({
      errors: ['email already registered'],
      status: 400
    })
  }

  // reject request if email has a domain that is on the deny list

  if (['aol.com', 'hotmail.com'].some((v) => askedEmail.endsWith(v))) {
    return next({
      errors: ['email address suspicious'],
      status: 403
    })
  }

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
    email: askedEmail,
    password,
    platformRole,
    username
  })
  logger.info('%s: created account', askedEmail)

  // notify user that their user account is created
  // we are intentionally not awaiting on this operation

  const link = `${config.webapp.root}/account/activate?key=${activationKey}`
  mailer.mailUser(newUser, 'Welcome to Weasel', 'auth-signup-user', {
    verificationLink: link
  })

  // notify platform admins that a new user account was verified.

  mailer.mailAdmins({
    title: 'New Account Created',
    body: `New account created for <b>${username}</b> (<a href="mailto:${askedEmail}">${askedEmail}</a>).`
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

  tracker.create(newUser, {
    $email: newUser.email,
    $created: newUser.createdAt.toISOString(),
    $ip: askedIpAddress
  })
  tracker.track(newUser, 'created_account')

  return res.status(201).json({})
}
