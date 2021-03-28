/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { ComparisonModel } from '../../src/schemas/comparison'

describe('model-comparison', function () {
  it('reject making comparison doc with missing requierd keys', function (done) {
    const cmpModel = new ComparisonModel({})
    cmpModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.dstMessageId.kind).to.equal('required')
      expect(err.errors.srcMessageId.kind).to.equal('required')
      done()
    })
  })
  it('allow making comparison doc if requierd keys exist', function (done) {
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
