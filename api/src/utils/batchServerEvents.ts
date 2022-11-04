import { ServerEvents } from './serverEvents'
import { BatchItem } from '@touca/api-schema'
import {
  IConnIdentifier,
  TEventWriterRequest,
  TEventWriterResponse
} from './serverEvents'
import { BatchEventType, BatchInsertEvent } from '@touca/server-events'

interface BroadCaster {
  broadcast(data: {}, matchClient: (connId: IConnIdentifier) => boolean): void
  handle(req: TEventWriterRequest, res: TEventWriterResponse): void
}

export interface IInsertOneBatchParams {
  teamSlug: string
  suiteSlug: string
  batchItem: BatchItem
}

export class BatchServerEvents {
  constructor(private bc: BroadCaster) {}

  handle(req: TEventWriterRequest, res: TEventWriterResponse) {
    this.bc.handle(req, res)
  }

  insertOneBatch(params: IInsertOneBatchParams) {
    const eventData = this.formatInsertOneBatch(params.batchItem)

    this.bc.broadcast(
      eventData,
      (connId) =>
        connId.suite.slug === params.suiteSlug &&
        connId.team.slug === params.teamSlug
    )
  }

  private formatInsertOneBatch(batchItem: BatchItem): BatchInsertEvent {
    return {
      eventType: BatchEventType.BatchInsert,
      record: batchItem
    }
  }
}

export default new BatchServerEvents(new ServerEvents())
