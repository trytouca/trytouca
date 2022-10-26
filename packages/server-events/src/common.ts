import { BatchEventType } from "./batch";

type EventType = BatchEventType;

export interface ServerEvent {
  eventType: EventType;
  record: unknown;
}

export interface RawServerEvent {
  data: string;
}
