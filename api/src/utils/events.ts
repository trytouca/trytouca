// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ServerEventJob } from '@touca/api-schema'
import { Request, Response } from 'express'

interface Fingerprint {
  user: string
  teamId?: string
  suiteId?: string
  batchId?: string
}

class EventWriter {
  private error: Error | null = null
  private fingerPrint: Fingerprint

  constructor(private req: Request, private res: Response) {
    this.fingerPrint = {
      user: (res.locals.user as any).username,
      teamId: (res.locals.team as any)?.id,
      suiteId: (res.locals.suite as any)?.id,
      batchId: (res.locals.batch as any)?.id
    }
    if (this.req.listeners('close').length === 0) {
      this.req.on('close', () => delete clients[this.req.ip])
    }
  }

  get fingerprint(): Fingerprint {
    return this.fingerPrint
  }

  hasError() {
    return !!this.error
  }

  write(data: unknown) {
    this.res.write(
      `data: ${JSON.stringify(data)}\n\n`,
      (e: Error) => (this.error = e)
    )
    // compression middleware requires calling flush; see:
    // https://www.npmjs.com/package/compression#server-sent-events
    if (!this.error) (this.res as any).flush()
  }
}

const clients: Record<string, EventWriter> = {}

export function handleEvents(req: Request, res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  })
  res.flushHeaders()
  clients[req.ip] = new EventWriter(req, res)
}

function shouldRelayEvent(cid: Fingerprint, job: ServerEventJob) {
  if (job.type === 'batch:processed' && cid.suiteId !== undefined) {
    return cid.suiteId === job.suiteId && cid.teamId === job.teamId
  }
  if (job.type === 'batch:sealed' && cid.suiteId === undefined) {
    return cid.suiteId === job.suiteId && cid.teamId === job.teamId
  }
  return false
}

export function broadcastEvent(job: ServerEventJob) {
  Object.values(clients)
    .filter((v) => !v.hasError() && shouldRelayEvent(v.fingerprint, job))
    .forEach((v) => v.write(job))
}
