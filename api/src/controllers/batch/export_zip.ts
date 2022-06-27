// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import archiver from 'archiver'
import { NextFunction, Request, Response } from 'express'
import { Builder } from 'flatbuffers'

import { IBatchDocument } from '@/schemas/batch'
import { MessageModel } from '@/schemas/message'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeam } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import * as minio from '@/utils/minio'
import { MessageBuffer, Messages } from '@/utils/schema'
import { analytics, EActivity } from '@/utils/tracker'

function toChunkFiles(messages: Buffer[]): ArrayBuffer[] {
  const chunks = []
  for (let i = 0, j = 0; i < messages.length; j = i) {
    for (let chunkSize = 0; i < messages.length; i = i + 1) {
      const fileSize = messages[i].byteLength
      if (10 * 1024 * 1024 < chunkSize + fileSize) {
        i++
        break
      }
      chunkSize += fileSize
    }
    chunks.push(messages.slice(j, i))
  }

  const out = []
  for (const chunk of chunks) {
    const builder = new Builder(1024)
    const msg_buf = []
    for (const message of chunk) {
      const buf = MessageBuffer.createBufVector(builder, message)
      MessageBuffer.startMessageBuffer(builder)
      MessageBuffer.addBuf(builder, buf)
      msg_buf.push(MessageBuffer.endMessageBuffer(builder))
    }
    const fbs_msg_buf = Messages.createMessagesVector(builder, msg_buf)
    Messages.startMessages(builder)
    Messages.addMessages(builder, fbs_msg_buf)
    const fbs_messages = Messages.endMessages(builder)
    builder.finish(fbs_messages)
    out.push(builder.asUint8Array())
  }
  return out
}

/**
 * @summary
 * Export test results for a given version.
 *
 * @description
 * Exports test results for batch `batch` of a suite `suite`.
 *
 * This function is meant to be called after the following middleware:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamMember`
 *  - `hasSuite` to yield `suite`
 *  - `hasBatch` to yield `batch`
 */
export async function ctrlBatchExportZIP(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const filename = [team.slug, suite.slug, batch.slug].join('_') + '.zip'
  logger.debug('%s: exporting %s', user.username, filename)

  if (!batch.sealedAt) {
    return next({ errors: ['batch is not sealed'], status: 400 })
  }

  const elements = await MessageModel.find({ batchId: batch._id }, { _id: 1 })
  const messages: Buffer[] = await Promise.all(
    elements.map(async (v) => minio.getMessage(v.id))
  )
  const chunks = toChunkFiles(messages)

  const archive = archiver('zip', { zlib: { level: 9 } })
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
  res.setHeader('Content-Type', 'application/zip')
  archive.pipe(res)

  chunks.forEach((content, index) => {
    archive.append(Buffer.from(content), {
      prefix: [suite.slug, batch.slug].join('/'),
      name:
        chunks.length === 1
          ? `${batch.slug}.bin`
          : `${batch.slug}.part${index}.bin`
    })
  })

  await archive.finalize()
  logger.info('%s: exported %s', user.username, filename)
  analytics.add_activity(EActivity.BatchZipExported, user, { filename })
}
