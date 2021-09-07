// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { expect } from 'chai'
import { describe } from 'mocha'
import mongoose from 'mongoose'

import { SessionModel } from '../../src/schemas/session'
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
  it('issue token and parse it', (done) => {
    const token = jwt.issue(session)
    const payload = jwt.extractPayload(token)
    const seconds = Math.floor(expiresAt.getTime() / 1000)
    expect(payload.exp).to.equal(seconds)
    expect(payload.sub).to.equal(session._id.toHexString())
    done()
  })
  it('handle request with missing token', (done) => {
    const payload = jwt.extractPayload(undefined)
    // tslint:disable-next-line: no-unused-expression
    expect(payload).to.not.exist
    done()
  })
})
