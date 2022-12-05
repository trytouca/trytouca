// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { describe, expect, test } from 'vitest'

import { config } from '../src/utils'

describe('config', () => {
  test('NODE_ENV is test for unit tests', () => {
    expect(config.env).toEqual('test')
  })
})
