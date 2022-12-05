// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from 'vitest'

import { config, configMgr } from '../src/utils'

describe('config', () => {
  test('NODE_ENV is test for unit tests', () => {
    expect(config.env).toEqual('test')
  })
  describe('configMgr', () => {
    test('getMongoUri', () => {
      expect(configMgr.getMongoUri()).toEqual(
        'mongodb://toucauser:toucapass@localhost:27017/test'
      )
    })
    test('hasMailTransportEnvironmentVariables', () => {
      expect(configMgr.hasMailTransportEnvironmentVariables()).toEqual(false)
    })
  })
})
