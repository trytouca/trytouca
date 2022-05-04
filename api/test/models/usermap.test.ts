// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { afterEach, beforeEach, describe, expect } from '@jest/globals'
import { Types } from 'mongoose'
import sinon from 'sinon'

import { UserMap } from '../../src/models/usermap'
import { UserModel } from '../../src/schemas/user'

describe('model-usermap', () => {
  let mockObj = null
  const idA = new Types.ObjectId()
  const idB = new Types.ObjectId()
  const idC = new Types.ObjectId()
  const expectedOut = [
    { _id: idA, fullname: 'User A', username: 'userA' },
    { _id: idB, fullname: 'User B', username: 'userB' },
    { _id: idC, fullname: 'User C', username: 'userC' }
  ]
  beforeEach(() => {
    mockObj = sinon.stub(UserModel, 'aggregate')
    mockObj.returns(Promise.resolve(expectedOut as any))
  })
  afterEach(() => {
    mockObj.restore()
  })
  const groupA = [idA]
  const groupB = [idB, idC]
  const groupC = [idA, idB, idC]
  test('basic usage', async () => {
    const userMap = await new UserMap()
      .addGroup('group-A', groupA)
      .addGroup('group-B', groupB)
      .addGroup('group-C', groupC)
      .populate()
    expect(userMap.getGroup('group-B')).toEqual([
      { fullname: 'User B', username: 'userB' },
      { fullname: 'User C', username: 'userC' }
    ])
    expect(userMap.lookup(idA)).toEqual({
      fullname: 'User A',
      username: 'userA'
    })
    expect(userMap.allUsers()).toEqual(
      expectedOut.map((v) => {
        const { _id, ...rest } = v
        return rest
      })
    )
  })
})
