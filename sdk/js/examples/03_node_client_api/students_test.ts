// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { parse_profile } from './students';

(async () => {
  await touca.configure();
  for (const username of ['alice', 'bob', 'charlie']) {
    touca.declare_testcase(username);

    const student = await touca.scoped_timer('parse_profile', async () =>
      parse_profile(username)
    );

    touca.add_result('fullname', student.fullname);
    touca.add_result('birth_date', student.dob);
    touca.add_result('gpa', student.gpa);
    touca.add_metric('external_source', 150);
  }
  await touca.post();
  await touca.seal();
})();
