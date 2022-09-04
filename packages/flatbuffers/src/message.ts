// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { ByteBuffer } from "flatbuffers";
import * as Schema from "./schema/generated/root";
import { unwrap } from "./type-wrapper";

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

export { Message, deserialize };
