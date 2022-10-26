import { BatchItem } from "@touca/api-schema";
import { ServerEvent } from "./common";

export enum BatchEventType {
  BatchInsert = "batchInsert"
}

export interface BatchInsertEvent extends ServerEvent {
  eventType: BatchEventType.BatchInsert;
  record: BatchItem;
}

export const isBatchInsertEvent = (
  eventData: ServerEvent
): eventData is BatchInsertEvent =>
  eventData.eventType === BatchEventType.BatchInsert;
