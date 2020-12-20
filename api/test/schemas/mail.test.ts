/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { expect } from 'chai'
import { describe } from 'mocha'

import { MailModel } from '../../src/schemas/mail'

describe('model-mail', function() {
  it('reject making mail doc with missing requierd keys', function(done) {
    const mailModel = new MailModel({})
    mailModel.validate(function(err) {
      expect(err.name).to.equal('ValidationError')
      expect(err.errors.recipient.kind).to.equal('required')
      expect(err.errors.sender.kind).to.equal('required')
      expect(err.errors.subject.kind).to.equal('required')
      done()
    })
  })
  it('allow making mail doc if requierd keys exist', function(done) {
    const mailModel = new MailModel({
      recipient: 'some_recipient',
      sender: 'some sender',
      subject: 'some_subject'
    })
    mailModel.validate(function(err) {
      expect(err).to.equal(null)
      done()
    })
  })
})
