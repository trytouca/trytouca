/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'
import sinon from 'sinon'

import { setupSuperuser } from '../../src/startup'
import { IUser, UserModel } from '../../src/schemas/user'

describe('setupSuperuser', function() {
  let mockObj = null
  const expectedUid = mongoose.Types.ObjectId('5e07929143bb5a0606dff3a8')
  const user = {
    _id: expectedUid,
    email: 'some_email',
    fullname: 'some_fullname',
    username: 'some_username'
  } as IUser
  before(() => {
    mockObj = sinon.stub(UserModel, 'wslGetSuperUser')
    mockObj.returns(Promise.resolve(user) as any)
  })
  after(() => {
    mockObj.restore()
  })
  it('when user already exists', (done) => {
    setupSuperuser().then((uid) => {
      expect(uid).to.equal(expectedUid)
    })
    done()
  })
})
