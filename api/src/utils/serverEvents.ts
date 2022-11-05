import { Request, Response } from 'express'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { ITeamDocument } from '@/schemas/team'
import { ObjectId } from 'mongoose'
import { ISuiteDocument } from '@/schemas/suite'
import { IBatchDocument } from '@/schemas/batch'

export type TEventWriterRequest = Pick<Request, 'ip' | 'on'>

export type TEventWriterResponse = Pick<
  Response,
  'write' | 'locals' | 'writeHead' | 'flushHeaders'
>

interface IEventWriter {
  write(data: {}, msgId: number, eventType?: string): void
  identity(): IConnIdentifier
  onClose(cb: (clientIP: string, writerID: number) => void): void
  error(): Error | null
}

export type TEventConnTeam = Pick<ITeamDocument, '_id' | 'name' | 'slug'>
export type TEventConnSuite = Pick<ISuiteDocument, '_id' | 'name' | 'slug'>
// truncate Team and Suite types for convenience in testing, since we won't use
// the other properties on the I*Document types.
export interface IConnIdentifier {
  id: number
  user: IUser | null
  team: TEventConnTeam | null
  suite: TEventConnSuite | null
  batch: (IBatchDocument & { _id: ObjectId }) | null
}

export const formatEvent = (data: string, id: number) =>
  `data: ${data}\nid${id}\n\n`

class EventWriter {
  private hasCloseHandler = false
  private err: Error | null = null
  private connIdentifier: IConnIdentifier

  constructor(
    private req: TEventWriterRequest,
    private res: TEventWriterResponse,
    private _id: number
  ) {
    this.handleErr = this.handleErr.bind(this)

    this.setupIdentifier(res)
  }

  identity() {
    return this.connIdentifier
  }

  private setupIdentifier(res: TEventWriterResponse) {
    try {
      const user = res?.locals?.user as IUser
      const team = res?.locals?.team ?? null
      const suite = res?.locals?.suite ?? null
      const batch = res?.locals?.batch ?? null

      this.connIdentifier = { user, team, suite, batch, id: this._id }
    } catch (e) {
      this.handleErr(e)
    }
  }

  private handleErr(e?: Error) {
    if (e !== undefined || e !== undefined) {
      this.err = e
    }
  }

  write(data: {}, msgId: number) {
    let JSONData = ''

    try {
      JSONData = JSON.stringify({ ...data })
    } catch (e) {
      logger.error(
        'EventWriter unable to serialize data for writer %d:\n%v\nno event will be transmitted to clients',
        this._id,
        data
      )

      return
    }

    const msg = formatEvent(JSONData, msgId)

    // @todo: should handle stream states better here
    this.res.write(msg, this.handleErr)

    if (this.error() === null) {
      // need flush() call b/c of compression middleware, c.f.
      // https://www.npmjs.com/package/compression#server-sent-events
      //   need 'any' type because the appropriate intersection type is apparently
      // a type bomb--process crashes when trying to compile
      // Pick<
      //   Response,
      //   'write' | 'locals' | 'writeHead'
      // > & {flush: () => void}
      ;(this.res as any).flush()
    }
  }

  onClose(cb: (clientIP: string, writerId?: number) => void) {
    if (this.hasCloseHandler) {
      return
    }
    this.hasCloseHandler = true
    this.req.on('close', () => cb(this.req.ip, this._id))
  }

  error() {
    return this.err
  }
}

export class ServerEvents {
  private currWriterId: number = 0
  private currMsgId: number = 0
  private clients: Map<string, IEventWriter> = new Map()

  constructor() {
    this.handle = this.handle.bind(this)
    this.broadcast = this.broadcast.bind(this)
  }

  handle(req: TEventWriterRequest, res: TEventWriterResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    res.flushHeaders()

    const writer = new EventWriter(req, res, this.currWriterId)

    writer.onClose((ip) => this.removeClient(ip))

    this.clients.set(req.ip, writer)

    this.currWriterId++
  }

  broadcast(
    data: {},
    matchClient: (connId: IConnIdentifier) => boolean = () => true
  ) {
    for (let writer of this.clients.values()) {
      if (writer.error() !== null) return

      if (matchClient(writer.identity())) {
        writer.write(data, this.currMsgId)
      }
    }

    this.currMsgId++
  }

  private removeClient(ip: string) {
    this.clients.delete(ip)
  }
}

export default new ServerEvents()
