/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { MessageModel } from '../../src/schemas/message'

describe('model-message', function () {
  it('reject making message doc with missing requierd keys', function (done) {
    const messageModel = new MessageModel({})
    messageModel.validate(function (err) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.batchId.kind).to.equal('required')
      expect(err.errors.builtAt.kind).to.equal('required')
      expect(err.errors.elementId.kind).to.equal('required')
      expect(err.errors.expiresAt.kind).to.equal('required')
      expect(err.errors.submittedAt.kind).to.equal('required')
      done()
    })
  })
  it('allow making message doc if requierd keys exist', function (done) {
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
