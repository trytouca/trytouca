// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { relay } from '@/models/relay'
import { wslFindByRole } from '@/models/user'
import { MetaModel } from '@/schemas/meta'
import { NodeModel } from '@/schemas/node'
import { IUser } from '@/schemas/user'
import { EPlatformRole } from '@/types/commontypes'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { mailUser } from '@/utils/mailer'
import { rclient } from '@/utils/redis'
import { analytics, EActivity } from '@/utils/tracker'

export async function platformInstall(
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.info('received server install request')
  const contact = {
    company: req.body.company,
    email: req.body.email,
    name: req.body.name,
    uuid: uuidv4()
  }
  if (['company', 'email', 'name', 'uuid'].every((key) => !(key in contact))) {
    return next({
      status: 400,
      errors: ['invalid request']
    })
  }

  if ((await MetaModel.countDocuments()) === 0) {
    await MetaModel.create({})
    logger.info('created meta document')
  }

  if (config.isCloudHosted) {
    logger.info('new self-hosted install')
    await NodeModel.create({
      company: contact.company,
      email: contact.email,
      name: contact.name,
      uuid: contact.uuid
    })
    const user: IUser = {
      _id: contact.uuid,
      email: contact.email,
      fullname: contact.name,
      platformRole: EPlatformRole.User,
      username: contact.uuid
    }
    analytics.add_member(user, { name: user.fullname }).then(() =>
      analytics.add_activity(EActivity.SelfHostedInstall, user, {
        company: contact.company
      })
    )
    const owners = await wslFindByRole(EPlatformRole.Owner)
    mailUser(owners[0], 'New Self-Hosted Instance', 'user-install', contact)
    return res.status(204).send()
  }

  if (await MetaModel.countDocuments({ contact: { $exists: true } })) {
    return next({
      status: 403,
      errors: ['server is registered']
    })
  }

  await MetaModel.updateOne({}, { $set: { contact } })
  const response = await relay({
    path: '/platform/install',
    data: JSON.stringify(contact)
  })
  logger.info('server registered')
  rclient.removeCached('platform-config')
  rclient.removeCached('platform-health')

  return res.status(response.status).send()
}
