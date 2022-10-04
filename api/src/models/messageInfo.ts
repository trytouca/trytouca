// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'

export class MessageInfo {
  public teamSlug: string
  public batchId: mongoose.Types.ObjectId
  public batchName: string
  public contentId: string
  public elementId: mongoose.Types.ObjectId
  public elementName: string
  public messageArtifacts: string[]
  public messageId: mongoose.Types.ObjectId
  public suiteId: mongoose.Types.ObjectId
  public suiteName: string

  public constructor(init?: Partial<MessageInfo>) {
    Object.assign(this, init)
  }

  public name(): string {
    return [
      this.teamSlug,
      this.suiteName,
      this.batchName,
      this.elementName
    ].join('/')
  }
}
