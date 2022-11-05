import { IUser } from '@/schemas/user'
import mongoose from 'mongoose'
import {
  ServerEvents,
  TEventWriterRequest,
  TEventWriterResponse,
  formatEvent,
  TEventConnTeam,
  TEventConnSuite
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

const getTestTeam = (): TEventConnTeam => {
  const _id = new mongoose.Types.ObjectId()

  return {
    _id,
    name: 'Some Team',
    slug: 'someTeam'
  }
}

const getTestSuite = (): TEventConnSuite => {
  const _id = new mongoose.Types.ObjectId()

  return {
    _id,
    name: 'Some Suite',
    slug: 'someSuite'
  }
}

const getTestRes = (): TEventWriterResponse => {
  return {
    locals: { user: getTestUser() },
    write: jest.fn(),
    writeHead: jest.fn(),
    // @ts-ignore
    flush: jest.fn(),
    flushHeaders: jest.fn()
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

    events.broadcast(mockData)

    const expected = formatEvent(JSON.stringify(mockData), 0)

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

    events.broadcast({ value: 1 })

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

    events.broadcast({ value: 1 })

    // first broadcast causes error
    expect(res.write).toHaveBeenCalledTimes(1)

    events.broadcast({ value: 2 })

    // second broadcast doesn't write to errored client--still only called 1 time
    expect(res.write).toHaveBeenCalledTimes(1)

    // simulate client retry
    events.handle(req, res)

    events.broadcast({ value: 2 })

    // write succeeds this time, so call count increments
    expect(res.write).toHaveBeenCalledTimes(2)
  })

  it('filters clients on broadcast', () => {
    const events = new ServerEvents()

    const reqOne = getTestReq()
    const resOne = getTestRes()

    resOne.locals.team = getTestTeam()
    resOne.locals.suite = getTestSuite()

    const reqTwo = getTestReq()
    const resTwo = getTestRes()

    resTwo.locals.team = getTestTeam()
    resTwo.locals.suite = getTestSuite()

    // monkey-patch resTwo so it does not match the filter function
    // passed to 'broadcast'
    resTwo.locals.team.slug = 'someOtherTeam'

    events.handle(reqOne, resOne)
    events.handle(reqTwo, resTwo)

    events.broadcast(
      { value: 42 },
      (connId) => connId.team.slug === resOne.locals.team.slug
    )

    expect(resOne.write).toHaveBeenCalledTimes(1)
    expect(resTwo.write).not.toHaveBeenCalled()
  })
})
