import { IUser } from '@/schemas/user'
import mongoose from 'mongoose'
import { Z_NO_FLUSH } from 'zlib'
import {
  ServerEvents,
  IEventWriter,
  TEventWriterRequest,
  TEventWriterResponse,
  EventWriter,
  formatEvent
} from './serverEvents'

const makeTestReqFn = () => {
  let ip = [0, 0, 0, 0]
  let incPos = 3

  return () => {
    const nextIp = ip.join('.')

    ip[incPos]++

    if (ip[incPos] === 255) {
      incPos--
    }

    return { ip: nextIp, on: jest.fn() } as TEventWriterRequest
  }
}

const getTestReq = makeTestReqFn()

const getTestUser = (): IUser => {
  const _id = new mongoose.Types.ObjectId()

  return {
    _id,
    email: 'bob@bob.com',
    fullname: 'bob robertson',
    platformRole: 'super',
    username: 'bobbybob'
  }
}

const getTestRes = (): TEventWriterResponse => {
  return {
    locals: getTestUser(),
    write: jest.fn(),
    writeHead: jest.fn(),
    flush: jest.fn()
  }
}

describe('ServerEvents', () => {
  it('writes event stream headers', () => {
    const req = getTestReq()
    const res = getTestRes()

    const events = new ServerEvents()
    events.handle(req, res)

    const expectedHeaders = {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    }

    expect(res.writeHead).toHaveBeenCalledWith(200, expectedHeaders)
  })

  it('broadcasts correctly-formatted events', () => {
    const events = new ServerEvents()

    const req1 = getTestReq()
    const res1 = getTestRes()

    const req2 = getTestReq()
    const res2 = getTestRes()

    events.handle(req1, res1)
    events.handle(req2, res2)

    const mockData = { value: 1 }

    events.broadcast(mockData, 'testEvent')

    const expected = formatEvent(JSON.stringify(mockData), 1, 'testEvent')

    // ignore the callback function 'write' gets called with
    expect(res1.write).toHaveBeenCalledWith(expected, expect.anything())
    expect(res2.write).toHaveBeenCalledWith(expected, expect.anything())
  })

  it('removes closed client connections', () => {
    const events = new ServerEvents()

    const req1 = getTestReq()
    const res1 = getTestRes()

    const req2 = getTestReq() as any
    const res2 = getTestRes()

    // monkey-patch to simulate connection close
    req2.on = (e: string, cb: Function) => (req2._cb = cb)
    req2.close = () => req2._cb()

    events.handle(req1, res1)
    events.handle(req2, res2)

    req2.close()

    events.broadcast({ value: 1 }, 'testEvent')

    expect(res1.write).toHaveBeenCalledTimes(1)
    expect(res2.write).not.toHaveBeenCalled()
  })

  it('does not broadcast to errored connections', () => {
    const events = new ServerEvents()

    const req = getTestReq()
    const res = getTestRes()

    let failureCount = 0

    const failedWriteStub = jest.fn(
      (_: any, cb?: (e: Error | null | undefined) => void) => {
        if (failureCount < 1) {
          cb(new Error('write failed'))
          failureCount++
          return false as boolean
        }
      }
    )

    res.write = failedWriteStub as any

    events.handle(req, res)

    events.broadcast({ value: 1 }, 'testEvent')

    // first broadcast causes error
    expect(res.write).toHaveBeenCalledTimes(1)

    events.broadcast({ value: 2 }, 'testEvent')

    // second broadcast doesn't write to errored client--still only called 1 time
    expect(res.write).toHaveBeenCalledTimes(1)

    // simulate client retry
    events.handle(req, res)

    events.broadcast({ value: 2 }, 'testEvent')

    // write succeeds this time, so call count increments
    expect(res.write).toHaveBeenCalledTimes(2)
  })
})
