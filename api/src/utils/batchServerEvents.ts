import { BatchItem } from '@touca/api-schema'
import {
  IConnIdentifier,
  TEventWriterRequest,
  TEventWriterResponse
} from './serverEvents'

interface BroadCaster {
  broadcast(data: {}, matchClient: (connId: IConnIdentifier) => boolean): void
  handle(req: TEventWriterRequest, res: TEventWriterResponse): void
}

export interface IBatchInsertedParams {
  teamSlug: string
  suiteSlug: string
  batchItem: BatchItem
}

class BatchServerEvents {
  constructor(private bc: BroadCaster) {}

  handle(req: TEventWriterRequest, res: TEventWriterResponse) {
    this.bc.handle(req, res)
  }

  batchInserted(params: IBatchInsertedParams) {
    this.bc.broadcast(
      params.batchItem,
      (connId) =>
        connId.suite.slug === params.suiteSlug &&
        connId.team.slug === params.teamSlug
    )
  }
}
export default BatchServerEvents
