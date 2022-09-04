// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Builder, ByteBuffer } from "flatbuffers";
import * as Schema from "./schema/generated/root";
import { unwrap } from "./type-wrapper";

type Nullable<T> = { [K in keyof T]: T[K] | null };

type Type =
  | boolean
  | bigint
  | number
  | string
  | Array<Type>
  | { [key: string]: Type };

type Metadata = {
  teamslug: string;
  testsuite: string;
  version: string;
  testcase: string;
  builtAt: string;
};

enum ResultType {
  Assert = Schema.ResultType.Assert,
  Check = Schema.ResultType.Check,
}

type Result = {
  type: Schema.ResultType;
  value: Type;
};

type Metric = {
  value: Type;
};

type Message = {
  metadata: Metadata;
  results: Record<string, Result>;
  metrics: Record<string, Metric>;
};

function deserialize(bytes: Uint8Array): Message {
  let buffer = new ByteBuffer(bytes);
  let message = Schema.Message.getRootAsMessage(buffer);
  let metadata = message.metadata()!;
  let results = message.results()!;
  let metrics = message.metrics()!;
  return {
    metadata: {
      teamslug: metadata.teamslug()!,
      testsuite: metadata.testsuite()!,
      version: metadata.version()!,
      testcase: metadata.testcase()!,
      builtAt: metadata.builtAt()!,
    },
    results: Object.fromEntries(
      Array.from({ length: results.entriesLength() }, (_, i) => {
        let result = results.entries(i)!;
        let key = result.key()!;
        let wrapper = result.value()!;
        let value = unwrap(wrapper);
        let type =
          result.typ() === Schema.ResultType.Assert
            ? Schema.ResultType.Assert
            : Schema.ResultType.Check;
        return [key, { type, value }];
      })
    ),
    metrics: Object.fromEntries(
      Array.from({ length: metrics.entriesLength() }, (_, i) => {
        let entry = metrics.entries(i)!;
        let key = entry.key()!;
        let wrapper = entry.value()!;
        let value = unwrap(wrapper);
        return [key, { value }];
      })
    ),
  };
}

function serializeMessages(messages: Buffer[]) {
  const builder = new Builder(1024);
  const msg_buf = [];
  for (const message of messages) {
    const buf = Schema.MessageBuffer.createBufVector(builder, message);
    Schema.MessageBuffer.startMessageBuffer(builder);
    Schema.MessageBuffer.addBuf(builder, buf);
    msg_buf.push(Schema.MessageBuffer.endMessageBuffer(builder));
  }
  const fbs_msg_buf = Schema.Messages.createMessagesVector(builder, msg_buf);
  Schema.Messages.startMessages(builder);
  Schema.Messages.addMessages(builder, fbs_msg_buf);
  const fbs_messages = Schema.Messages.endMessages(builder);
  builder.finish(fbs_messages);
  return builder.asUint8Array();
}

/**
 * Parses binary data in flatbuffers format into a list of submission items.
 * Note that we only parse metadata of each submission.
 *
 * @param content binary data in flatbuffers format
 * @returns list of submission items
 */
function parseMessageHeaders(
  content: Uint8Array
): { metadata: Nullable<Metadata>; raw: Buffer }[] {
  const messages: { metadata: Nullable<Metadata>; raw: Buffer }[] = [];
  const buf = new ByteBuffer(content);
  const msgs = Schema.Messages.getRootAsMessages(buf);
  for (let i = 0; i < msgs.messagesLength(); i++) {
    const msgBuffer = msgs.messages(i);
    if (!msgBuffer) continue;
    const msgData = msgBuffer.bufArray();
    if (!msgData) continue;
    const msgByteBuffer = new ByteBuffer(msgData);
    const msg = Schema.Message.getRootAsMessage(msgByteBuffer);
    const metadata = msg.metadata();
    if (!metadata) continue;
    messages.push({
      metadata: {
        builtAt: metadata.builtAt(),
        teamslug: metadata.teamslug(),
        testsuite: metadata.testsuite(),
        version: metadata.version(),
        testcase: metadata.testcase(),
      },
      raw: Buffer.from(msgByteBuffer.bytes()),
    });
  }
  return messages;
}

export {
  Message,
  ResultType,
  deserialize,
  serializeMessages,
  parseMessageHeaders,
};
