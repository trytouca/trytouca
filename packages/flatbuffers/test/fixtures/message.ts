// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { readFile } from 'node:fs/promises'
import { Message } from '../../src/message'
import { ResultType } from '../../src/schema/generated/root'

export default {
  bytes: await readFile(new URL('./message.bin', import.meta.url)),
  value: {
    metadata: {
      teamslug: 'acme',
      testsuite: 'students',
      version: 'v1.0',
      testcase: 'charli',
      builtAt: '2021-11-14T23:19:26.042504'
    },
    results: [
      {
        key: 'birth_date',
        value: {
          dict: { day: 19n, month: 9n, year: 2003n }
        },
        type: ResultType.Check
      },
      {
        key: 'courses',
        value: [
          {
            Course: { grade: 3.7, name: 'computers' }
          },
          {
            Course: { grade: 2.9, name: 'math' }
          }
        ],
        type: ResultType.Check
      },
      { key: 'fullname', value: 'Charlie Clark', type: ResultType.Check },
      { key: 'gpa', value: 3.3, type: ResultType.Check },
      { key: 'number of courses', value: 2n, type: ResultType.Check },
      { key: 'pass', value: true, type: ResultType.Check },
      { key: 'username', value: 'charli', type: ResultType.Assert }
    ],
    metrics: [
      { key: 'calculate_gpa', value: 329n },
      { key: 'external_source', value: 500n },
      { key: 'find_student', value: 564n }
    ]
  } as Message
}
