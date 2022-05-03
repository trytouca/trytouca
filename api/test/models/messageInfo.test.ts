// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { expect } from 'chai'
import { describe } from 'mocha'

import { MessageInfo } from '../../src/models/messageInfo'

describe('model-messageInfo', function () {
  it('allow making message info using partial object', function (done) {
    const messageInfo = new MessageInfo({
      teamSlug: 'some_teamSlug',
      suiteName: 'some_suiteName',
      batchName: 'some_batchName',
      elementName: 'some_elementName',
      contentId: 'some_contentId'
    })
    expect(messageInfo.teamSlug).to.equal('some_teamSlug')
    expect(messageInfo.suiteName).to.equal('some_suiteName')
    expect(messageInfo.batchName).to.equal('some_batchName')
    expect(messageInfo.elementName).to.equal('some_elementName')
    expect(messageInfo.contentId).to.equal('some_contentId')
    expect(messageInfo.name()).to.equal(
      'some_teamSlug/some_suiteName/some_batchName/some_elementName'
    )
    done()
  })
})
