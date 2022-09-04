// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { expect, test } from "vitest";
import FIXTURE from "../test/fixtures/message";
import { deserialize } from "./message";

test(deserialize.name, () => {
  let { bytes, value } = FIXTURE;

  expect(deserialize(bytes)).toStrictEqual(value);
});
