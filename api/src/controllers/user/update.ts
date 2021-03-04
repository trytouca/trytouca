/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'
import * as bcrypt from 'bcrypt'
import { omit } from 'lodash'
import { IUser, UserModel } from '../../schemas/user'
import { config } from '../../utils/config'
import logger from '../../utils/logger'

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
  const proposed = {
    fullname: req.body.fullname,
    username: req.body.username,
    password: req.body.password
  }
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

  return res.status(204).send()
}
