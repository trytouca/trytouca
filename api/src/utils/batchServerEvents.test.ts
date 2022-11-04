import { IUser } from '@/schemas/user'
import { BatchItem } from '@touca/api-schema'
import mongoose from 'mongoose'
import BatchServerEvents from './batchServerEvents'
import {
  IConnIdentifier,
  TEventConnSuite,
  TEventConnTeam,
  TEventWriterResponse
} from './serverEvents'

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

let connId = 0

const getMockConnIdentifier = (): IConnIdentifier => {
  const cid: IConnIdentifier = {
    user: getTestUser(),
    team: getTestTeam(),
    suite: getTestSuite(),
    batch: null,
    id: connId
  }

  connId++

  return cid
}

describe('BatchServerEvents', () => {
  it('batch inserted', () => {
    const mockClients: IConnIdentifier[] = [null, null].map(() =>
      getMockConnIdentifier()
    )

    const matched: number[] = []
    let broadcastData: any

    const broadcast = (
      data: {},
      matchClient: (connId: IConnIdentifier) => boolean
    ) => {
      broadcastData = data
      mockClients.forEach((c) => {
        if (matchClient(c)) {
          matched.push(c.id)
        }
      })
    }

    mockClients[1].team.slug = 'wrongTeam'

    // don't care about actual data here
    const batchItem = { value: 42 } as unknown as BatchItem

    const bse = new BatchServerEvents({ broadcast, handle: jest.fn() })

    bse.batchInserted({
      batchItem,
      teamSlug: 'someTeam',
      suiteSlug: 'someSuite'
    })

    // asserts that we're filtering correctly
    expect(matched).toEqual([mockClients[0].id])
    expect(broadcastData).toEqual(batchItem)
  })
})
