/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import * as bcrypt from 'bcrypt'
import { once } from 'lodash'
import { EPlatformRole } from '../../commontypes'
import { addSampleData } from '../../models/sampleData'
import { UserModel } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'
import * as mailer from '../../utils/mailer'

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
  const askedEmail = req.body.email
  const askedPassword = req.body.password
  const askedUsername = req.body.username
  const askedFullname = req.body.fullname || req.body.username

  // return 400 if user is already registered
  // important not to use any of the static helper functions of user schema
  // here since we like to include suspended accounts in our check.

  if (await UserModel.countDocuments({ username: askedUsername })) {
    return next({
      errors: ['user already registered'],
      status: 400
    })
  }

  // return 400 if email is already associated with any user
  // important not to use any of the static helper functions of user schema
  // here since we like to include suspended accounts in our check.

  if (await UserModel.countDocuments({ email: askedEmail })) {
    return next({
      errors: ['email already registered'],
      status: 400
    })
  }

  // generate password hash
  // we perform this operation after checking if user is registered
  // to avoid paying the cost of hash generation in case they are

  const hash = await bcrypt.hash(askedPassword, config.auth.bcryptSaltRound)

  // generate activation key
  // we send this key in the welcome email to the user so we can verify
  // their email address.

  const activationKey = [...Array(config.auth.activationKeyLength)]
    .map(() => Math.random().toString(36)[2])
    .join('')

  // the first user who creates an account should be the platform owner.
  // we make this check once per lifetime of this node process.

  const platformRole = await once(getPlatformOwner)()

  // register user in database

  const newUser = await UserModel.create({
    activationKey,
    createdAt: new Date(),
    email: askedEmail,
    fullname: askedFullname,
    password: hash,
    platformRole,
    username: askedUsername
  })
  logger.info('%s: created account', askedUsername)

  // notify user that their user account is created
  // we are intentionally not awaiting on this operation

  const verificationLink = `${config.webapp.root}/activate?key=${activationKey}`

  mailer.mailUser(newUser, 'Welcome to Weasel', 'auth-signup-user', {
    fullname: newUser.fullname || newUser.username,
    username: newUser.username,
    verificationLink
  })

  // if configured to do so, create a "tutorial" suite and populate it with
  // sample test results.

  if (!config.samples.disabled) {
    addSampleData(newUser)
  } else {
    logger.debug(
      '%s: skipped submission of sample data. feature is disabled.',
      newUser.username
    )
  }

  return res.status(201).send()
}
