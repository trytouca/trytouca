// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { parse_profile } from './students';

(async () => {

  await touca.configure();
  for (const username of ['alice', 'bob', 'charlie']) {
    touca.declare_testcase(username);

    const student = parse_profile(username)!;

    touca.add_result('fullname', student.username);
    touca.add_result('height', student.height);
    touca.add_result('weight', student.weight);
    touca.add_result('birth_date', student.dob);
    touca.add_metric('some-metric', 1250);

    touca.scoped_timer('scoped-timer', async () => {
      await new Promise((v) => setTimeout(v, 100));
    });

    touca.start_timer('some-timer');
    await new Promise((v) => setTimeout(v, 100));
    touca.stop_timer('some-timer');
  }
  await touca.post();
  await touca.seal();

})();
