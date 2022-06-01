// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from '@jest/globals'

import { config, configMgr } from '../../src/utils/config'

describe('config', () => {
  test('NODE_ENV is test for unit tests', () => {
    expect(config.env).toEqual('test')
  })
})

describe('config-manager', () => {
  test('get-mongo-uri', () => {
    expect(configMgr.getMongoUri()).toEqual(
      'mongodb://toucauser:toucapass@localhost:27017/test'
    )
  })
  test('get-redis-uri', () => {
    expect(configMgr.getRedisUri()).toEqual('redis://localhost:6379/test')
  })
  test('has-mail-transport', () => {
    expect(configMgr.hasMailTransport()).toEqual(false)
  })
})
