// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { pick } from 'lodash-es'

import { wslFindByRole } from '../../models/index.js'
import { IUser, NodeModel } from '../../schemas/index.js'
import { analytics, EActivity, logger, mailUser } from '../../utils/index.js'

export async function installHandle(
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.info('received self-hosted install report')
  const keys = ['company', 'email', 'name', 'uuid']
  const contact = pick(req.body, keys)
  if (keys.every((key) => !(key in contact))) {
    return next({ status: 400, errors: ['invalid request'] })
  }
  await NodeModel.create(contact)
  const user: IUser = {
    _id: contact.uuid,
    email: contact.email,
    fullname: contact.name,
    platformRole: 'user',
    username: contact.uuid
  }
  await analytics.add_member(user, { name: user.fullname, email: user.email })
  await analytics.add_activity(EActivity.SelfHostedInstall, user, {
    company: contact.company
  })
  const owners = await wslFindByRole('owner')
  mailUser(owners[0], 'New Self-Hosted Instance', 'user-install', contact)
  logger.info('processed self-hosted install report')
  return res.status(204).send()
}
