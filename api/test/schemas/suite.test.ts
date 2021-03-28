/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { SuiteModel } from '../../src/schemas/suite'
import { config } from '../../src/utils/config'

describe('model-suite', () => {
  const createdBy = new mongoose.Types.ObjectId()
  const team = new mongoose.Types.ObjectId()

  describe('schema', () => {
    it('reject making suite doc if requierd keys are missing', function (done) {
      const suiteModel = new SuiteModel({})
      suiteModel.validate(function (err: any) {
        expect(err.errors.name.kind).to.equal('required')
        expect(err.errors.createdBy.kind).to.equal('required')
        expect(err.errors.slug.kind).to.equal('required')
        expect(err.errors.team.kind).to.equal('required')
        done()
      })
    })
    it('allow making suite doc if requierd keys exist', function (done) {
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
