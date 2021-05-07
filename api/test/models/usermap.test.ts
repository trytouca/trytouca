/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'
import { Types } from 'mongoose'
import sinon from 'sinon'

import { UserMap } from '../../src/models/usermap'
import { UserModel } from '../../src/schemas/user'

describe('model-usermap', function () {
  let mockObj = null
  const idA = new Types.ObjectId()
  const idB = new Types.ObjectId()
  const idC = new Types.ObjectId()
  const expectedOut = [
    { _id: idA, fullname: 'User A', username: 'userA' },
    { _id: idB, fullname: 'User B', username: 'userB' },
    { _id: idC, fullname: 'User C', username: 'userC' }
  ]
  before(() => {
    mockObj = sinon.stub(UserModel, 'aggregate')
    mockObj.returns(Promise.resolve(expectedOut as any))
  })
  after(() => {
    mockObj.restore()
  })
  const groupA = [idA]
  const groupB = [idB, idC]
  const groupC = [idA, idB, idC]
  it('basic usage', async () => {
    const userMap = await new UserMap()
      .addGroup('group-A', groupA)
      .addGroup('group-B', groupB)
      .addGroup('group-C', groupC)
      .populate()
    expect(userMap.getGroup('group-B')).to.eql([
      { fullname: 'User B', username: 'userB' },
      { fullname: 'User C', username: 'userC' }
    ])
    expect(userMap.lookup(idA)).to.eql({
      fullname: 'User A',
      username: 'userA'
    })
    expect(userMap.allUsers()).to.eql(
      expectedOut.map((v) => {
        const { _id, ...rest } = v
        return rest
      })
    )
  })
})
