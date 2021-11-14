// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { Course, calculate_gpa, find_student } from './students';

(async () => {
  await touca.configure();
  for (const username of await touca.get_testcases()) {
    touca.declare_testcase(username);

    touca.start_timer('find_student');
    const student = await find_student(username);
    touca.stop_timer('find_student');

    touca.assume('username', student.username);
    touca.check('fullname', student.fullname);
    touca.check('birth_date', student.dob);

    touca.add_serializer(Course.name, (x: Course) => [x.name, x.grade]);
    for (const course of student.courses) {
      touca.add_array_element('courses', course);
      touca.add_hit_count('number of courses');
    }

    await touca.scoped_timer('find_student', async () =>
      touca.check('gpa', await calculate_gpa(student.courses))
    );
    touca.add_metric('external_source', 1500);

    await touca.post();
    await touca.save_json(`touca_${username}.json`);
    await touca.save_binary(`touca_${username}.bin`);
    touca.forget_testcase(username);
  }
  await touca.seal();
})();
