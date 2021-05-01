/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
export class MessageInfo {
  public batchId: mongoose.Types.ObjectId
  public batchName: string
  public contentId: string
  public elementId: mongoose.Types.ObjectId
  public elementName: string
  public messageId: mongoose.Types.ObjectId
  public suiteId: mongoose.Types.ObjectId
  public suiteName: string

  public constructor(init?: Partial<MessageInfo>) {
    Object.assign(this, init)
  }

  public name(): string {
    return [this.suiteName, this.batchName, this.elementName].join('/')
  }
}
