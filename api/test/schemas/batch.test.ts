/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { BatchModel } from '../../src/schemas/batch'

describe('model-batch', function () {
  it('reject making batch doc with missing requierd keys', function (done) {
    const batchModel = new BatchModel({})
    batchModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.slug.kind).to.equal('required')
      expect(err.errors.suite.kind).to.equal('required')
      expect(err.errors.superior.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if requierd keys exist', function (done) {
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
