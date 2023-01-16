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
  private fp: Fingerprint

  constructor(private req: Request, private res: Response) {
    this.fp = {
      user: (res.locals.user as any).username,
      teamId: (res.locals.team as any)?.id,
      suiteId: (res.locals.suite as any)?.id,
      batchId: (res.locals.batch as any)?.id
    }
    res
      .writeHead(200, {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream'
      })
      .flushHeaders()
  }

  get fingerprint(): Fingerprint {
    return this.fp
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
  clients[req.ip] = new EventWriter(req, res)
  if (req.listenerCount('close') === 0) {
    req.on('close', () => {
      delete clients[req.ip]
    })
  }
}

function shouldRelayEvent(cid: Fingerprint, job: ServerEventJob) {
  const events: Record<
    'team' | 'suite' | 'batch',
    Array<ServerEventJob['type']>
  > = {
    team: ['suite:created', 'suite:updated'],
    suite: ['batch:created', 'batch:updated', 'batch:sealed'],
    batch: ['message:created', 'message:compared', 'batch:sealed']
  }
  return !cid.suiteId
    ? events.team.includes(job.type) && cid.teamId === job.teamId
    : !cid.batchId
    ? events.suite.includes(job.type) &&
      cid.teamId === job.teamId &&
      cid.suiteId === job.suiteId
    : events.batch.includes(job.type) &&
      cid.teamId === job.teamId &&
      cid.suiteId === job.suiteId &&
      cid.batchId === job.batchId
}

export function broadcastEvent(job: ServerEventJob) {
  Object.values(clients)
    .filter((v) => !v.hasError() && shouldRelayEvent(v.fingerprint, job))
    .forEach((v) => v.write(job))
}
