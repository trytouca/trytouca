/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import sinon from 'sinon'

import { EPlatformRole } from '../../src/commontypes'
import { UserModel } from '../../src/schemas/user'

describe('model-user', function () {
  it('reject making user doc if requierd keys are missing', function (done) {
    const userModel = new UserModel({})
    userModel.validate(function (err) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.email.kind).to.equal('required')
      expect(err.errors.username.kind).to.equal('required')
      done()
    })
  })
  it('allow making user doc if requierd keys exist', function (done) {
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
      UserModel.wslFindByUname('some_userName').then((doc) => {
        sinon.assert.calledWith(
          mockObj,
          { username: 'some_userName', suspended: false },
          { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
        )
      })
      done()
    })
    it('wslGetSuperUser', (done) => {
      UserModel.wslGetSuperUser().then((doc) => {
        sinon.assert.calledWith(
          mockObj,
          { platformRole: EPlatformRole.Super, suspended: false },
          { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
        )
      })
      done()
    })
    it('wslFindByRole', (done) => {
      UserModel.wslFindByRole(EPlatformRole.Admin).then((docs) => {
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
