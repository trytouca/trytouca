// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { expect } from 'chai'
import { describe } from 'mocha'

import { config, configMgr } from '../../src/utils/config'

describe('config', () => {
  it('NODE_ENV is test for unittests', () => {
    expect(config.env).to.equal('test')
  })
})

describe('config-manager', () => {
  it('get-mongo-uri', () => {
    expect(configMgr.getMongoUri()).to.equal(
      'mongodb://toucauser:toucapass@localhost:27017/test'
    )
  })
  it('get-redis-uri', () => {
    expect(configMgr.getRedisUri()).to.equal('redis://localhost:6379/test')
  })
  it('has-mail-transport', () => {
    expect(configMgr.hasMailTransport()).to.equal(false)
  })
})
