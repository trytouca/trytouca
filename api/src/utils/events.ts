// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ServerEventJob } from '@touca/api-schema'
import { Request, Response } from 'express'
import { ObjectId } from 'mongoose'

import { IBatchDocument } from '@/schemas/batch'
import { ISuiteDocument } from '@/schemas/suite'
import { ITeamDocument } from '@/schemas/team'
import { IUser } from '@/schemas/user'

interface Fingerprint {
  id: number
  user: IUser | null
  team: Pick<ITeamDocument, '_id' | 'name' | 'slug'> | null
  suite: Pick<ISuiteDocument, '_id' | 'name' | 'slug'> | null
  batch: (IBatchDocument & { _id: ObjectId }) | null
}

class EventWriter {
  private error: Error | null = null
  private fingerPrint: Fingerprint

  constructor(
    private req: Request,
    private res: Response,
    private writerId: number
  ) {
    this.fingerPrint = {
      user: res?.locals?.user as IUser,
      team: res?.locals?.team ?? null,
      suite: res?.locals?.suite ?? null,
      batch: res?.locals?.batch ?? null,
      id: this.writerId
    }
  }

  get fingerprint(): Fingerprint {
    return this.fingerPrint
  }

  has_error() {
    return !!this.error
  }

  write(data: unknown, msgId: number) {
    this.res.write(
      `data: ${JSON.stringify(data)}\nid${msgId}\n\n`,
      (e: Error) => (this.error = e)
    )
    // compression middleware requires calling flush; see:
    // https://www.npmjs.com/package/compression#server-sent-events
    if (!this.error) (this.res as any).flush()
  }

  onClose(cb: (clientIP: string, writerId?: number) => void) {
    if (this.req.listeners('close').length === 0) {
      this.req.on('close', () => cb(this.req.ip, this.writerId))
    }
  }
}

let currWriterId = 0
let currMsgId = 0
const clients: Record<string, EventWriter> = {}

export function handleEvents(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  })
  res.flushHeaders()
  const writer = new EventWriter(req, res, currWriterId)
  writer.onClose((ip) => delete clients[ip])
  clients[req.ip] = writer
  currWriterId++
}

function shouldRelayEvent(cid: Fingerprint, job: ServerEventJob) {
  if (job.type === 'batch:processed') {
    return cid.suite.slug === job.suiteSlug && cid.team.slug === job.teamSlug
  }
  if (job.type === 'batch:sealed') {
    return cid.suite.slug === job.suiteSlug && cid.team.slug === job.teamSlug
  }
  return false
}

export function broadcastEvent(job: ServerEventJob) {
  Object.values(clients)
    .filter((v) => !v.has_error())
    .filter((v) => shouldRelayEvent(v.fingerprint, job))
    .forEach((v) => v.write(job, currMsgId))
  currMsgId++
}
