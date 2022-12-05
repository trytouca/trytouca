// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import mongoose from 'mongoose'
import { describe, expect, test } from 'vitest'

import { SessionModel } from '../../src/schemas/index'
import * as jwt from '../../src/utils/jwt'

describe('utils/jwt', () => {
  const expiresAt = new Date()
  const userId = new mongoose.Types.ObjectId()
  const session = new SessionModel({
    agent: 'some_agent',
    expiresAt,
    ipAddr: '127.0.0.1',
    userId
  })
  test('issue token and parse it', () => {
    const token = jwt.issue(session)
    const payload = jwt.extractPayload(token)
    const seconds = Math.floor(expiresAt.getTime() / 1000)
    expect(payload.exp).toEqual(seconds)
    expect(payload.sub).toEqual(session._id.toHexString())
  })
  test('handle request with missing token', () => {
    expect(jwt.extractPayload(undefined)).toBeUndefined()
  })
})
