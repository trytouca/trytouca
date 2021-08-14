/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { touca } from '@touca/node';
import { parse_profile } from './wizards';

const delay = (ms: number) => new Promise((v) => setTimeout(v, ms));

(async () => {

  await touca.configure();
  for (const username of ['rweasley', 'hpotter', 'hgranger']) {
    touca.declare_testcase(username);

    const wizard = parse_profile(username);

    touca.add_result('fullname', wizard?.username);
    touca.add_result('height', wizard?.height);
    touca.add_result('weight', wizard?.weight);
    touca.add_result('birth_date', wizard?.dob);
    touca.add_metric('some-metric', 1250);

    touca.start_timer('some-timer');
    await delay(100 + Math.random() * 100);
    touca.stop_timer('some-timer');
  }
  await touca.post();

})();
