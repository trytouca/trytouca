// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { EPlatformRole } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { IUser, UserModel } from '../../schemas/user.js'
import logger from '../../utils/logger.js'

export async function platformAccountUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const account = res.locals.account as IUser
  const user = res.locals.user as IUser
  const roleNew = req.body.role as EPlatformRole
  logger.info(
    '%s: updating role of account %s to %s',
    user.username,
    account.username,
    roleNew
  )

  // corner case: no one allowed to be promoted to platform owner (already covered)
  // corner case: no one allowed to promote or demote themselves

  if (account.username === user.username) {
    return next({
      status: 403,
      errors: ['updating own role forbidden']
    })
  }

  // find current role of account and current role of this user

  const roleUser = user.platformRole
  const roleCurrent = account.platformRole

  // define a helper function to determine seniority of roles

  const orders: EPlatformRole[] = ['user', 'admin', 'owner']
  const getOrder = (role: EPlatformRole) => orders.findIndex((v) => v === role)

  // disallow admins to update accounts with a role higher than their own

  if (getOrder(roleUser) < getOrder(roleCurrent)) {
    return next({
      status: 403,
      errors: ['updating senior accounts forbidden']
    })
  }

  // disallow admins to update accounts to a role higher than their own

  if (getOrder(roleUser) < getOrder(roleNew)) {
    return next({
      status: 403,
      errors: ['promotion not allowed']
    })
  }

  // report done if new role is same as current role

  if (roleCurrent === roleNew) {
    logger.silly('%s: already has this role', account.username)
    return res.status(204).send()
  }

  // update role of account on platform

  await UserModel.findByIdAndUpdate(account._id, {
    platformRole: roleNew
  })

  logger.info(
    '%s: updated role of account %s to %s',
    user.username,
    account.username,
    roleNew
  )

  return res.status(204).send()
}
