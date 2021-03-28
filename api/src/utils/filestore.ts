/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import fs from 'fs'
import path from 'path'
import util from 'util'
import { Types } from 'mongoose'

import { MessageInfo } from '@weasel/models/messageInfo'
import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'

/**
 *
 */
class FileStore {
  /**
   *
   */
  constructor(private rootDir: string) {
    // Create the root storage directory if it does not exist
    this.rootDir = path.normalize(rootDir)
    if (!fs.existsSync(this.rootDir)) {
      fs.mkdirSync(this.rootDir, { recursive: true })
    }
  }

  /**
   * Stores a submitted message on Weasel Platform local filesystem.
   *
   * @param batchId string representation of the document id of the batch
   *                this submission belong to
   * @param messageId string representation of the document id of this message
   * @param content submitted message to be stored
   */
  public async add(
    batchId: string,
    messageId: string,
    content: Buffer
  ): Promise<void> {
    // filesystem directory hierarchy is defined by batchId and messageId of
    // the submitted test result.
    const resultFilePath = path.join(this.rootDir, batchId, messageId)
    const resultDirPath = path.dirname(resultFilePath)
    // ensure parent directories are created
    if (!fs.existsSync(resultDirPath)) {
      fs.mkdirSync(resultDirPath, { recursive: true })
    }
    // store file on disk
    const writeFile = util.promisify(fs.writeFile)
    await writeFile(resultFilePath, content)
  }

  /**
   *
   */
  public async remove(msg: MessageInfo) {
    const tuple = msg.name()
    // filesystem directory hierarchy is defined by batchId and messageId of
    // the submitted test result.
    const resultFilePath = path.join(
      this.rootDir,
      msg.batchId.toString(),
      msg.messageId.toString()
    )
    const unlink = util.promisify(fs.unlink)
    // remove file from disk
    await unlink(resultFilePath)
    logger.silly('%s: removed message from local filesystem', tuple)
  }

  /**
   *
   */
  public async removeEmptyDir(batchId: Types.ObjectId) {
    const dirname = batchId.toString()
    const readdir = util.promisify(fs.readdir)
    const rmdir = util.promisify(fs.rmdir)
    const dir = path.join(this.rootDir, dirname)
    const files = await readdir(dir)
    if (files.length === 0) {
      await rmdir(dir)
      logger.silly('removed result directory: %s', dir)
    }
  }
}

/**
 *
 */
export const filestore = new FileStore(config.storage.directory)
