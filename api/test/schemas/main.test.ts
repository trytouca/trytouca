/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'
import sinon from 'sinon'

import { ECommentType } from '../../src/backendtypes'
import { EPlatformRole } from '../../src/commontypes'
import {
  wslFindByRole,
  wslFindByUname,
  wslGetSuperUser
} from '../../src/models/user'
import { BatchModel } from '../../src/schemas/batch'
import { CommentModel } from '../../src/schemas/comment'
import { ComparisonModel } from '../../src/schemas/comparison'
import { ElementModel } from '../../src/schemas/element'
import { MailModel } from '../../src/schemas/mail'
import { MessageModel } from '../../src/schemas/message'
import { NotificationModel } from '../../src/schemas/notification'
import { EReportType, ReportModel } from '../../src/schemas/report'
import { SuiteModel } from '../../src/schemas/suite'
import { TeamModel } from '../../src/schemas/team'
import { UserModel } from '../../src/schemas/user'
import { config } from '../../src/utils/config'

describe('model-user', function () {
  it('reject making user doc if required keys are missing', function (done) {
    const userModel = new UserModel({})
    userModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.email.kind).to.equal('required')
      expect(err.errors.username.kind).to.equal('required')
      done()
    })
  })
  it('allow making user doc if required keys exist', function (done) {
    const userModel = new UserModel({
      email: 'some_email',
      fullname: 'Full Name',
      password: 'some_hash',
      platformRole: EPlatformRole.User,
      username: 'some_username'
    })
    userModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
  describe('get users that match a given field', () => {
    let mockObj = null
    const expectedOut = new UserModel({
      email: 'some_email',
      platformRole: EPlatformRole.Admin,
      username: 'some_username'
    })
    before(() => {
      mockObj = sinon.stub(UserModel, 'find')
      mockObj.returns(Promise.resolve([expectedOut]) as any)
    })
    after(() => {
      mockObj.restore()
    })
    it('wslFindByUname', (done) => {
      wslFindByUname('some_userName').then(() => {
        sinon.assert.calledWith(
          mockObj,
          { username: 'some_userName', suspended: false },
          { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
        )
      })
      done()
    })
    it('wslGetSuperUser', (done) => {
      wslGetSuperUser().then(() => {
        sinon.assert.calledWith(
          mockObj,
          { platformRole: EPlatformRole.Super, suspended: false },
          { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
        )
      })
      done()
    })
    it('wslFindByRole', (done) => {
      wslFindByRole(EPlatformRole.Admin).then(() => {
        sinon.assert.calledWith(
          mockObj,
          { platformRole: EPlatformRole.Admin, suspended: false },
          { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
        )
      })
      done()
    })
  })
})

describe('model-suite', () => {
  const createdBy = new mongoose.Types.ObjectId()
  const team = new mongoose.Types.ObjectId()

  describe('schema', () => {
    it('reject making suite doc if required keys are missing', function (done) {
      const suiteModel = new SuiteModel({})
      suiteModel.validate(function (err: any) {
        expect(err.errors.name.kind).to.equal('required')
        expect(err.errors.createdBy.kind).to.equal('required')
        expect(err.errors.slug.kind).to.equal('required')
        expect(err.errors.team.kind).to.equal('required')
        done()
      })
    })
    it('allow making suite doc if required keys exist', function (done) {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        team
      })
      suiteModel.validate(function (err) {
        expect(err).to.equal(null)
        done()
      })
    })
  })
  describe('retainFor', () => {
    it('retainFor field has default value', function (done) {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        team
      })
      suiteModel.validate((err) => expect(err).to.equal(null))
      expect(suiteModel.retainFor).to.equal(
        config.services.retention.defaultDuration
      )
      done()
    })
    it('retainFor field takes integral values', function (done) {
      const suiteModel = new SuiteModel({
        createdBy,
        slug: 'foo',
        name: 'Foo Bar',
        retainFor: 86400.234,
        team
      })
      suiteModel.validate((err) => expect(err).to.equal(null))
      expect(suiteModel.retainFor).to.equal(86400)
      done()
    })
  })
})

describe('model-message', function () {
  it('reject making message doc with missing required keys', function (done) {
    const messageModel = new MessageModel({})
    messageModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.batchId.kind).to.equal('required')
      expect(err.errors.builtAt.kind).to.equal('required')
      expect(err.errors.elementId.kind).to.equal('required')
      expect(err.errors.expiresAt.kind).to.equal('required')
      expect(err.errors.submittedAt.kind).to.equal('required')
      done()
    })
  })
  it('allow making message doc if required keys exist', function (done) {
    const messageModel = new MessageModel({
      batchId: mongoose.Types.ObjectId(),
      builtAt: new Date(),
      elementId: mongoose.Types.ObjectId(),
      expiresAt: new Date(),
      submittedAt: new Date()
    })
    messageModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-batch', function () {
  it('reject making batch doc with missing required keys', function (done) {
    const batchModel = new BatchModel({})
    batchModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.slug.kind).to.equal('required')
      expect(err.errors.suite.kind).to.equal('required')
      expect(err.errors.superior.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if required keys exist', function (done) {
    const batchModel = new BatchModel({
      slug: 'some_batch',
      suite: mongoose.Types.ObjectId()
    })
    batchModel.superior = batchModel._id
    batchModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-comparison', function () {
  it('reject making comparison doc with missing required keys', function (done) {
    const cmpModel = new ComparisonModel({})
    cmpModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.dstMessageId.kind).to.equal('required')
      expect(err.errors.srcMessageId.kind).to.equal('required')
      done()
    })
  })
  it('allow making comparison doc if required keys exist', function (done) {
    const cmpModel = new ComparisonModel({
      dstBatchId: mongoose.Types.ObjectId(),
      dstMessageId: mongoose.Types.ObjectId(),
      srcBatchId: mongoose.Types.ObjectId(),
      srcMessageId: mongoose.Types.ObjectId()
    })
    cmpModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-element', function () {
  it('reject making element doc with missing required keys', function (done) {
    const elementModel = new ElementModel({})
    elementModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.name.kind).to.equal('required')
      expect(err.errors.suiteId.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if required keys exist', function (done) {
    const elementModel = new ElementModel({
      name: 'some_element',
      suiteId: mongoose.Types.ObjectId()
    })
    elementModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-mail', function () {
  it('reject making mail doc with missing required keys', function (done) {
    const mailModel = new MailModel({})
    mailModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.recipient.kind).to.equal('required')
      expect(err.errors.sender.kind).to.equal('required')
      expect(err.errors.subject.kind).to.equal('required')
      done()
    })
  })
  it('allow making mail doc if required keys exist', function (done) {
    const mailModel = new MailModel({
      recipient: 'some_recipient',
      sender: 'some sender',
      subject: 'some_subject'
    })
    mailModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-team', function () {
  it('reject making doc with missing required keys', function (done) {
    const teamModel = new TeamModel({})
    teamModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.name.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if required keys exist', function (done) {
    const teamModel = new TeamModel({
      name: 'Some Team',
      slug: 'some_team',
      owner: new mongoose.Types.ObjectId()
    })
    teamModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-comment', function () {
  const createdAt = new Date()
  const createdBy = new mongoose.Types.ObjectId()

  it('reject making comment doc with missing required keys', function (done) {
    const commentModel = new CommentModel({})
    commentModel.validate((err: any) => {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.at.kind).to.equal('required')
      expect(err.errors.by.kind).to.equal('required')
      expect(err.errors.text.kind).to.equal('required')
      done()
    })
  })
  it('allow making comment doc if required keys exist', function (done) {
    const commentModel = new CommentModel({
      at: createdAt,
      by: createdBy,
      text: 'some_text',
      type: ECommentType.Batch
    })
    commentModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-report', function () {
  const dstBatchId = new mongoose.Types.ObjectId()
  const srcBatchId = new mongoose.Types.ObjectId()

  it('reject making report doc with missing required keys', function (done) {
    const reportModel = new ReportModel({})
    reportModel.validate((err: any) => {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.dstBatchId.kind).to.equal('required')
      expect(err.errors.srcBatchId.kind).to.equal('required')
      expect(err.errors.reportType.kind).to.equal('required')
      done()
    })
  })
  it('allow making report doc if required keys exist', function (done) {
    const reportModel = new ReportModel({
      dstBatchId,
      srcBatchId,
      reportType: EReportType.Promote
    })
    reportModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})

describe('model-notification', function () {
  const userId = new mongoose.Types.ObjectId()

  it('reject making notification doc with missing required keys', function (done) {
    const notificationModel = new NotificationModel({})
    notificationModel.validate((err: any) => {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.createdAt.kind).to.equal('required')
      expect(err.errors.text.kind).to.equal('required')
      expect(err.errors.userId.kind).to.equal('required')
      done()
    })
  })
  it('allow making notification doc if required keys exist', function (done) {
    const notificationModel = new NotificationModel({
      createdAt: new Date(),
      text: 'some_text',
      userId
    })
    notificationModel.validate(function (err) {
      expect(err).to.equal(null)
      done()
    })
  })
})
