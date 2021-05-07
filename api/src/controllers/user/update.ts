/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { IUser, UserModel } from '@weasel/schemas/user'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'
import * as mailer from '@weasel/utils/mailer'
import { tracker } from '@weasel/utils/tracker'
import * as bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { identity, omit, pick, pickBy } from 'lodash'

/**
 * Updates information about current user.
 */
export async function ctrlUserUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tuple = user.username
  const proposed = pickBy(
    pick(req.body, ['fullname', 'username', 'password']),
    identity
  )
  logger.debug('%s: updating account: %j', tuple, omit(proposed, 'password'))

  // if username is changing, check that the new username is not already taken

  if (proposed.username) {
    if (await UserModel.countDocuments({ username: proposed.username })) {
      return next({
        errors: ['username already registered'],
        status: 409
      })
    }
  }

  // hash password

  if (proposed.password) {
    proposed.password = await bcrypt.hash(
      proposed.password,
      config.auth.bcryptSaltRound
    )
  }

  // attempt to update account information

  await UserModel.findOneAndUpdate({ _id: user._id }, { $set: proposed })
  logger.info('%s: updated account: %j', tuple, omit(proposed, 'password'))

  // notify platform admins that a new user account was verified.

  mailer.mailAdmins({
    title: 'New Account Verified',
    body: `New account created for <b>${proposed.fullname}</b> (<a href="mailto:${user.email}">${proposed.username}</a>).`
  })

  // add event to tracking system

  if (user.fullname === '' && proposed.fullname) {
    tracker.create(user, {
      $name: proposed.fullname,
      username: proposed.username
    })
  }
  tracker.track(user, 'updated_profile')

  return res.status(204).send()
}
