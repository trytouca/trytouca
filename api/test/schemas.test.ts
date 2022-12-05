// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Types } from 'mongoose'
import { describe, expect, test } from 'vitest'

import {
  BatchModel,
  CommentModel,
  ComparisonModel,
  ElementModel,
  EReportType,
  MailModel,
  MessageModel,
  NotificationModel,
  ReportModel,
  SuiteModel,
  TeamModel,
  UserModel
} from '../src/schemas'
import { ECommentType } from '../src/types'
import { config } from '../src/utils'

describe('model_user', () => {
  test('reject making user doc if required keys are missing', () => {
    const userModel = new UserModel({})
    const err = userModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.email.kind).toEqual('required')
    expect(err?.errors.username.kind).toEqual('required')
  })
  test('allow making user doc if required keys exist', () => {
    const userModel = new UserModel({
      email: 'some_email',
      fullname: 'Full Name',
      password: 'some_hash',
      platformRole: 'user',
      username: 'some_username'
    })
    expect(userModel.validateSync()).toBeUndefined()
  })
})

describe('model_suite', () => {
  const createdBy = new Types.ObjectId()
  const team = new Types.ObjectId()

  describe('schema', () => {
    test('reject making suite doc if required keys are missing', () => {
      const suiteModel = new SuiteModel({})
      const err = suiteModel.validateSync()
      expect(err?.errors.name.kind).toEqual('required')
      expect(err?.errors.createdBy.kind).toEqual('required')
      expect(err?.errors.slug.kind).toEqual('required')
      expect(err?.errors.team.kind).toEqual('required')
    })
    test('allow making suite doc if required keys exist', () => {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        team
      })
      expect(suiteModel.validateSync()).toBeUndefined()
    })
  })
  describe('retainFor', () => {
    test('retainFor field has default value', () => {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        team
      })
      expect(suiteModel.validateSync()).toBeUndefined()
      expect(suiteModel.retainFor).toEqual(
        config.services.retention.defaultDuration
      )
    })
    test('retainFor field takes integral values', () => {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        retainFor: 86400.234,
        team
      })
      expect(suiteModel.validateSync()).toBeUndefined()
      expect(suiteModel.retainFor).toEqual(86400)
    })
  })
})

describe('model_message', () => {
  test('reject making message doc with missing required keys', () => {
    const messageModel = new MessageModel({})
    const err = messageModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.batchId.kind).toEqual('required')
    expect(err?.errors.builtAt.kind).toEqual('required')
    expect(err?.errors.elementId.kind).toEqual('required')
    expect(err?.errors.expiresAt.kind).toEqual('required')
    expect(err?.errors.submittedAt.kind).toEqual('required')
  })
  test('allow making message doc if required keys exist', () => {
    const messageModel = new MessageModel({
      batchId: new Types.ObjectId(),
      builtAt: new Date(),
      elementId: new Types.ObjectId(),
      expiresAt: new Date(),
      submittedAt: new Date()
    })
    expect(messageModel.validateSync()).toBeUndefined()
  })
})

describe('model_batch', () => {
  test('reject making batch doc with missing required keys', () => {
    const batchModel = new BatchModel({})
    const err = batchModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.slug.kind).toEqual('required')
    expect(err?.errors.suite.kind).toEqual('required')
    expect(err?.errors.superior.kind).toEqual('required')
  })
  test('allow making result doc if required keys exist', () => {
    const batchModel = new BatchModel({
      slug: 'some_batch',
      suite: new Types.ObjectId()
    })
    batchModel.superior = batchModel._id
    expect(batchModel.validateSync()).toBeUndefined()
  })
})

describe('model_comparison', () => {
  test('reject making comparison doc with missing required keys', () => {
    const cmpModel = new ComparisonModel({})
    const err = cmpModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.dstMessageId.kind).toEqual('required')
    expect(err?.errors.srcMessageId.kind).toEqual('required')
  })
  test('allow making comparison doc if required keys exist', () => {
    const cmpModel = new ComparisonModel({
      dstBatchId: new Types.ObjectId(),
      dstMessageId: new Types.ObjectId(),
      srcBatchId: new Types.ObjectId(),
      srcMessageId: new Types.ObjectId()
    })
    expect(cmpModel.validateSync()).toBeUndefined()
  })
})

describe('model_element', () => {
  test('reject making element doc with missing required keys', () => {
    const elementModel = new ElementModel({})
    const err = elementModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.name.kind).toEqual('required')
    expect(err?.errors.slug.kind).toEqual('required')
    expect(err?.errors.suiteId.kind).toEqual('required')
  })
  test('allow making result doc if required keys exist', () => {
    const elementModel = new ElementModel({
      name: 'Some Element',
      slug: 'some_element',
      suiteId: new Types.ObjectId()
    })
    expect(elementModel.validateSync()).toBeUndefined()
  })
})

describe('model_mail', () => {
  test('reject making mail doc with missing required keys', () => {
    const mailModel = new MailModel({})
    const err = mailModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.recipient.kind).toEqual('required')
    expect(err?.errors.sender.kind).toEqual('required')
    expect(err?.errors.subject.kind).toEqual('required')
  })
  test('allow making mail doc if required keys exist', () => {
    const mailModel = new MailModel({
      recipient: 'some_recipient',
      sender: 'some sender',
      subject: 'some_subject'
    })
    expect(mailModel.validateSync()).toBeUndefined()
  })
})

describe('model_team', () => {
  test('reject making doc with missing required keys', () => {
    const teamModel = new TeamModel({})
    const err = teamModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.name.kind).toEqual('required')
  })
  test('allow making result doc if required keys exist', () => {
    const teamModel = new TeamModel({
      name: 'Some Team',
      slug: 'some_team',
      owner: new Types.ObjectId()
    })
    expect(teamModel.validateSync()).toBeUndefined()
  })
})

describe('model_comment', () => {
  const createdAt = new Date()
  const createdBy = new Types.ObjectId()

  test('reject making comment doc with missing required keys', () => {
    const commentModel = new CommentModel({})
    const err = commentModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.at.kind).toEqual('required')
    expect(err?.errors.by.kind).toEqual('required')
    expect(err?.errors.text.kind).toEqual('required')
  })
  test('allow making comment doc if required keys exist', () => {
    const commentModel = new CommentModel({
      at: createdAt,
      by: createdBy,
      text: 'some_text',
      type: ECommentType.Batch
    })
    expect(commentModel.validateSync()).toBeUndefined()
  })
})

describe('model_report', () => {
  const dstBatchId = new Types.ObjectId()
  const srcBatchId = new Types.ObjectId()

  test('reject making report doc with missing required keys', () => {
    const reportModel = new ReportModel({})
    const err = reportModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.dstBatchId.kind).toEqual('required')
    expect(err?.errors.srcBatchId.kind).toEqual('required')
    expect(err?.errors.reportType.kind).toEqual('required')
  })
  test('allow making report doc if required keys exist', () => {
    const reportModel = new ReportModel({
      dstBatchId,
      srcBatchId,
      reportType: EReportType.Promote
    })
    expect(reportModel.validateSync()).toBeUndefined()
  })
})

describe('model_notification', () => {
  test('reject making notification doc with missing required keys', () => {
    const notificationModel = new NotificationModel({})
    const err = notificationModel.validateSync()
    expect(err?.name).toEqual('ValidationError')
    expect(err?.errors.createdAt.kind).toEqual('required')
    expect(err?.errors.text.kind).toEqual('required')
    expect(err?.errors.userId.kind).toEqual('required')
  })
  test('allow making notification doc if required keys exist', () => {
    const userId = new Types.ObjectId()
    const notificationModel = new NotificationModel({
      createdAt: new Date(),
      text: 'some_text',
      userId
    })
    expect(notificationModel.validateSync()).toBeUndefined()
  })
})
