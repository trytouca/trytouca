/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { TeamModel } from '../../src/schemas/team'

describe('model-team', function () {
  it('reject making doc with missing requierd keys', function (done) {
    const teamModel = new TeamModel({})
    teamModel.validate(function (err) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.name.kind).to.equal('required')
      done()
    })
  })
  it('allow making result doc if requierd keys exist', function (done) {
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
