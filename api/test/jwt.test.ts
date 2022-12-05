// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Types } from 'mongoose'
import { describe, expect, test } from 'vitest'

import { SessionModel } from '../src/schemas'
import { jwtExtract, jwtIssue } from '../src/utils'

describe('utils/jwt', () => {
  const expiresAt = new Date()
  const userId = new Types.ObjectId()
  const session = new SessionModel({
    agent: 'some_agent',
    expiresAt,
    ipAddr: '127.0.0.1',
    userId
  })
  test('issue token and parse it', () => {
    const token = jwtIssue(session)
    const payload = jwtExtract(token)
    const seconds = Math.floor(expiresAt.getTime() / 1000)
    expect(payload.exp).toEqual(seconds)
    expect(payload.sub).toEqual(session._id.toHexString())
  })
  test('handle request with missing token', () => {
    expect(jwtExtract(undefined)).toBeUndefined()
  })
})
