// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { parse_profile } from './students';

touca.workflow('students_test', async (username: string) => {
  touca.start_timer('parse_profile');
  const student = await parse_profile(username);
  touca.stop_timer('parse_profile');
  touca.add_assertion('username', student.username);
  touca.add_result('fullname', student.fullname);
  touca.add_result('birth_date', student.dob);
  touca.add_result('gpa', student.gpa);
  touca.add_metric('external_source', 150);
});

touca.run();
