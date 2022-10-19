import { Request, Handler, Response, NextFunction } from 'express'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'

export type TEventWriterRequest = Pick<Request, 'ip' | 'on'>
export type TEventWriterResponse = Pick<
  Response,
  'write' | 'locals' | 'writeHead'
>

export interface IEventWriter {
  write(data: {}, eventType?: string): void
  getUser(): IUser
  onClose(cb: (clientIP: string, writerID: number) => void): void
  error(): Error | null
}

export class EventWriter {
  private hasCloseHandler = false
  private err: Error | null = null
  private msgId: number = 0

  constructor(
    private req: TEventWriterRequest,
    private res: TEventWriterResponse,
    private _id: number
  ) {
    this.handleErr = this.handleErr.bind(this)
  }

  getUser() {
    return { ...(this.res.locals as IUser) }
  }

  private handleErr(e?: Error) {
    if (e !== undefined || e !== undefined) {
      this.err = e
    }
  }

  write(data: {}, eventType?: string) {
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

    // @todo: should handle stream states better here
    this.res.write(`id:${this.msgId}\n`, this.handleErr)

    if (eventType !== undefined) {
      this.res.write(`event:${eventType}\n`, this.handleErr)
    }

    this.res.write(JSONData, this.handleErr)

    this.msgId++
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
  private clients: Map<string, IEventWriter> = new Map()

  constructor() {
    this.handle = this.handle.bind(this)
  }

  handle(req: TEventWriterRequest, res: TEventWriterResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const writer = new EventWriter(req, res, this.currWriterId)

    writer.onClose((ip) => this.removeClient(ip))

    this.clients.set(req.ip, writer)

    this.currWriterId++
  }

  broadcast(data: {}, eventType?: string) {
    for (let writer of this.clients.values()) {
      if (writer.error() === null) {
        writer.write(data, eventType)
      }
    }
  }

  private removeClient(ip: string) {
    this.clients.delete(ip)
  }
}

export default new ServerEvents()
