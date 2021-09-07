// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { expect } from 'chai'
import { describe } from 'mocha'

import { MessageInfo } from '../../src/models/messageInfo'

describe('model-messageInfo', function () {
  it('allow making message info using partial object', function (done) {
    const messageInfo = new MessageInfo({
      batchName: 'some_batchName',
      contentId: 'some_contentId',
      elementName: 'some_elementName',
      suiteName: 'some_suiteName'
    })
    expect(messageInfo.batchName).to.equal('some_batchName')
    expect(messageInfo.contentId).to.equal('some_contentId')
    expect(messageInfo.elementName).to.equal('some_elementName')
    expect(messageInfo.suiteName).to.equal('some_suiteName')
    expect(messageInfo.name()).to.equal(
      'some_suiteName/some_batchName/some_elementName'
    )
    done()
  })
})
