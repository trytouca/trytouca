// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import * as bcrypt from 'bcrypt'
import { NextFunction, Request, Response } from 'express'
import { identity, omit, pick, pickBy } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { IUser, UserModel } from '@/schemas/user'
import { EFeatureFlag } from '@/types/commontypes'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { tracker } from '@/utils/tracker'

async function updateFeatureFlags(user: IUser, flags: Record<string, boolean>) {
  logger.debug('%s: updating feature flag: %j', user.username, flags)
  const insert = Object.keys(flags).filter((v) => flags[v] === true)
  if (insert) {
    await UserModel.findByIdAndUpdate(user._id, {
      $addToSet: { featureFlags: { $each: insert } }
    })
  }
  const remove = Object.keys(flags).filter((v) => flags[v] === false)
  if (remove) {
    await UserModel.findByIdAndUpdate(user._id, {
      $pull: { featureFlags: { $in: remove } }
    })
  }
  logger.info('%s: updated feature flag: %j', user.username, flags)
  tracker.track(user, 'updated_feature_flag', flags)
}

/**
 * Updates information about current user.
 */
export async function userUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const tuple = user.username

  const flags = pick(req.body.flags, [EFeatureFlag.NewsletterProduct])
  if (Object.keys(flags).length !== 0) {
    updateFeatureFlags(user, flags)
    return res.status(204).send()
  }

  if (req.body.key) {
    const askedKey = req.body.key
    const userKeys = await UserModel.findOne(
      {
        _id: user._id,
        apiKeys: { $in: askedKey }
      },
      { apiKeys: 1 }
    )
    if (!userKeys) {
      return next({
        errors: ['api key not known'],
        status: 400
      })
    }
    const apiKeys = userKeys.apiKeys
    apiKeys.splice(apiKeys.indexOf(askedKey), 1, uuidv4())
    await UserModel.findByIdAndUpdate(user._id, { $set: { apiKeys } })
    return res.status(200).json({ apiKeys })
  }

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

  if (user.fullname === '' && proposed.fullname) {
    mailer.mailAdmins({
      title: 'New Account Verified',
      body: `New account created for <b>${proposed.fullname}</b> (<a href="mailto:${user.email}">${proposed.username}</a>).`
    })
  }

  // add event to tracking system. since user is already registered,
  // we can perform the two operations independently.

  tracker.create(user, {
    name: proposed.fullname,
    username: proposed.username
  })
  tracker.track(user, 'updated_profile')

  return res.status(204).send()
}
