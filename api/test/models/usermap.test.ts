// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Types } from 'mongoose'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { UserMap } from '../../src/models/usermap'
import { UserModel } from '../../src/schemas/user'

describe('model/usermap', () => {
  const idA = new Types.ObjectId()
  const idB = new Types.ObjectId()
  const idC = new Types.ObjectId()
  const expectedOut = [
    { _id: idA, fullname: 'User A', username: 'userA' },
    { _id: idB, fullname: 'User B', username: 'userB' },
    { _id: idC, fullname: 'User C', username: 'userC' }
  ]
  afterEach(() => {
    vi.restoreAllMocks()
  })
  test('basic usage', async () => {
    vi.spyOn(UserModel, 'aggregate').mockResolvedValue(expectedOut as any)
    const userMap = await new UserMap()
      .addGroup('group-A', [idA])
      .addGroup('group-B', [idB, idC])
      .addGroup('group-C', [idA, idB, idC])
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
