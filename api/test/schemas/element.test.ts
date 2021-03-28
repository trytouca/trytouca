/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { ElementModel } from '../../src/schemas/element'

describe('model-element', function () {
  it('reject making element doc with missing requierd keys', function (done) {
    const elementModel = new ElementModel({})
    elementModel.validate(function (err: any) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.name.kind).to.equal('required')
      expect(err.errors.suiteId.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if requierd keys exist', function (done) {
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
