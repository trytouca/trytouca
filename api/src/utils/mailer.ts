/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import fs from 'fs'
import htmlToText from 'html-to-text'
import { has as lodashHas } from 'lodash'
import mustache from 'mustache'
import nodemailer from 'nodemailer'
import path from 'path'

import { EPlatformRole } from '../commontypes'
import { wslFindByRole, wslGetSuperUser } from '@weasel/models/user'
import { MailModel } from '@weasel/schemas/mail'
import { IUser, UserModel } from '@weasel/schemas/user'
import { config, configMgr } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'

const transporter = nodemailer.createTransport({
  auth: {
    pass: config.mail.pass,
    user: config.mail.user
  },
  host: config.mail.host,
  port: config.mail.port,
  secure: false
})

/**
 *
 */
async function mailUserImpl(
  recipient: IUser,
  subject: string,
  filename: string,
  view?: any
) {
  const filePath = path.join(config.mail.templatesDirectory, filename + '.html')
  const fileContent = fs.readFileSync(filePath, 'utf8')

  const bodyHtml = mustache.render(fileContent, view)
  const bodyPlain = htmlToText.fromString(bodyHtml, { wordwrap: 80 })

  const superuser = await wslGetSuperUser()

  // storing mail into database
  const doc = new MailModel({
    recipient: recipient.email,
    sender: superuser.email,
    subject
  })
  await doc.save()

  // send mail to user

  const result = await transporter.sendMail({
    from: `"${superuser.fullname}" <${superuser.email}>`,
    html: bodyHtml,
    subject: `[Weasel] ${subject}`,
    text: bodyPlain,
    to: recipient.email
  })

  // we expect nodemailer output to include a messageId

  if (!lodashHas(result, 'messageId')) {
    throw Error('failed to send mail')
  }
}

/**
 *
 */
export async function mailUser(
  recipient: IUser,
  subject: string,
  filename: string,
  params?: Record<string, unknown>
) {
  if (!configMgr.hasMailTransport()) {
    const level = config.env === 'production' ? 'warn' : 'debug'
    logger.log(level, 'mail server not configured')
    return
  }
  try {
    logger.silly('%s: %s: sending mail', filename, recipient.username)
    await mailUserImpl(recipient, subject, filename, params)
    logger.info('%s: %s: sent mail', filename, recipient.username)
  } catch (ex) {
    logger.warn(
      '%s: %s: failed to send mail: %j',
      filename,
      recipient.username,
      ex
    )
    return
  }
}

/**
 *
 */
export async function mailUsers(
  users: IUser[],
  subject: string,
  filename: string,
  params?: Record<string, string>
): Promise<boolean> {
  const jobs = users.map((user) => mailUser(user, subject, filename, params))
  const results = await Promise.all(jobs)
  return results.every(Boolean)
}

/**
 *
 */
async function mailUsersByRole(
  role: EPlatformRole,
  subject: string,
  filename: string,
  params?: Record<string, string>
): Promise<boolean> {
  const users = await wslFindByRole(role)
  return await mailUsers(users, subject, filename, params)
}

/**
 *
 */
export async function mailAdmins(params: { title: string; body: string }) {
  if (config.deployMode === 'cloud_hosted') {
    const users = await UserModel.find({
      platformRole: { $in: [EPlatformRole.Owner, EPlatformRole.Admin] }
    })
    return mailUsers(users, 'Admin Alert', 'mail-admin-notify', params)
  }
}
