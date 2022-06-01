// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { expect, test } from '@jest/globals'

import { MessageInfo } from '../../src/models/messageInfo'

test('allow making message info using partial object', () => {
  const messageInfo = new MessageInfo({
    teamSlug: 'some_teamSlug',
    suiteName: 'some_suiteName',
    batchName: 'some_batchName',
    elementName: 'some_elementName',
    contentId: 'some_contentId'
  })
  expect(messageInfo.teamSlug).toEqual('some_teamSlug')
  expect(messageInfo.suiteName).toEqual('some_suiteName')
  expect(messageInfo.batchName).toEqual('some_batchName')
  expect(messageInfo.elementName).toEqual('some_elementName')
  expect(messageInfo.contentId).toEqual('some_contentId')
  expect(messageInfo.name()).toEqual(
    'some_teamSlug/some_suiteName/some_batchName/some_elementName'
  )
})
