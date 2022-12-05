// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { EPlatformRole } from '@touca/api-schema'
// import { fromString } from 'html-to-text'
import { has as lodashHas, pick } from 'lodash-es'
import mustache from 'mustache'
import nodemailer, { Transporter } from 'nodemailer'
import { Attachment } from 'nodemailer/lib/mailer'

import { wslGetSuperUser } from '../models/index.js'
import { IUser, MailModel, MetaModel, UserModel } from '../schemas/index.js'
import { config } from './config.js'
import { logger } from './logger.js'

class EMail {
  private static transport: Transporter

  constructor(
    private readonly filename: string,
    private readonly params: Record<string, unknown>
  ) {}

  private async getTransport(): Promise<Transporter> {
    if (EMail.transport) {
      return EMail.transport
    }
    const meta = await MetaModel.findOne({}, { mail: 1 })
    if (meta?.mail) {
      EMail.transport = nodemailer.createTransport({
        auth: {
          pass: meta.mail.pass,
          user: meta.mail.user
        },
        host: meta.mail.host,
        port: meta.mail.port,
        secure: false
      })
    }
    return EMail.transport
  }

  public async send(
    recipient: IUser,
    subject: string,
    attachments: Attachment[] = []
  ): Promise<boolean> {
    const transport = await this.getTransport()
    if (!transport) {
      const level = config.env === 'production' ? 'warn' : 'debug'
      logger.log(level, 'mail server not configured')
      return
    }
    logger.silly('%s: %s: sending mail', this.filename, recipient.username)

    const filePath = join(
      config.mail.templatesDirectory,
      this.filename + '.html'
    )
    const fileContent = readFileSync(filePath, 'utf8')
    const bodyHtml = mustache.render(fileContent, this.params)
    // const bodyPlain = fromString(bodyHtml, { wordwrap: 80 })
    const superuser = await wslGetSuperUser()

    await MailModel.create({
      recipient: recipient.email,
      sender: superuser.email,
      subject
    })
    const result = await transport.sendMail({
      from: `"${superuser.fullname}" <${superuser.email}>`,
      html: bodyHtml,
      subject,
      // text: bodyPlain,
      to: recipient.email,
      attachments
    })

    // we expect nodemailer output to include a messageId
    if (!lodashHas(result, 'messageId')) {
      logger.error(
        '%s: %s: failed to send mail',
        this.filename,
        recipient.username
      )
      return false
    }
    logger.info('%s: %s: sent mail', this.filename, recipient.username)
    return true
  }
}

export async function mailUser(
  recipient: IUser,
  subject: string,
  filename: string,
  params?: Record<string, unknown>,
  attachments: Attachment[] = []
) {
  await new EMail(filename, params).send(recipient, subject, attachments)
}

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

export async function mailAdmins(params: { title: string; body: string }) {
  if (config.isCloudHosted) {
    const roles: EPlatformRole[] = ['owner', 'admin']
    const users = await UserModel.find({
      platformRole: { $in: roles }
    })
    return mailUsers(users, 'Admin Alert', 'mail-admin-notify', params)
  }
}

export async function hasMailTransport(): Promise<boolean> {
  return !!(await MetaModel.countDocuments({
    'mail.host': { $exists: true, $ne: '' }
  }))
}

export function hasMailTransportEnvironmentVariables() {
  return Object.values(
    pick(config.mail, ['host', 'pass', 'port', 'user'])
  ).every((v) => v)
}
