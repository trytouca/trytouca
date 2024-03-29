// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { touca } from '@touca/node';
import { is_prime } from './is_prime.js';

touca.workflow('is_prime_test', (testcase: string) => {
  const number = Number.parseInt(testcase);
  touca.check('is_prime_output', is_prime(number));
});

touca.run();
