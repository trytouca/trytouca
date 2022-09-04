// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { readFile } from "node:fs/promises";
import { Message } from "../../src/message";

export default {
  bytes: await readFile(new URL("./message.bin", import.meta.url)),
  json: (await import("./message.json")).default,
  value: {
    metadata: {
      testsuite: "students",
      version: "v1.0",
      testcase: "alice",
      builtAt: "2021-11-14T23:19:24.804068",
      teamslug: "acme",
    },
    results: {
      birth_date: {
        type: 1,
        value: {
          day: 1n,
          month: 3n,
          year: 2006n,
        },
      },
      courses: {
        type: 1,
        value: [
          {
            grade: 3.8,
            name: "computers",
          },
          {
            grade: 4,
            name: "math",
          },
        ],
      },
      fullname: {
        type: 1,
        value: "Alice Anderson",
      },
      gpa: {
        type: 1,
        value: 3.9,
      },
      "number of courses": {
        type: 1,
        value: 2n,
      },
      pass: {
        type: 1,
        value: true,
      },
      username: {
        type: 2,
        value: "alice",
      },
    },
    metrics: {
      calculate_gpa: {
        value: 320n,
      },
      external_source: {
        value: 500n,
      },
      find_student: {
        value: 562n,
      },
    },
  } as Message,
};
