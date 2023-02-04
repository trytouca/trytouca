// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { beforeEach, describe, expect, test } from 'vitest';

import { Case } from '../src/case';
import { ToucaError } from '../src/options';
import { ToucaType, TypeHandler } from '../src/types';

describe('basic operations', () => {
  let testcase: Case;
  const type_handler = new TypeHandler();
  const transform = (value: unknown): ToucaType => {
    return type_handler.transform(value);
  };

  beforeEach(() => {
    testcase = new Case({ name: 'some-case' });
    testcase.add_array_element('some-array', transform('some-array-element'));
    testcase.assume('some-assertion', transform('some-assertion-value'));
    testcase.check('some-result', transform('some-result-value'));
    testcase.add_hit_count('some-hit-count');
    testcase.add_metric('some-metric', 10);
  });

  test('check slugs are set to unknown when missing', () => {
    expect(testcase.json().metadata.teamslug).toEqual('unknown');
    expect(testcase.json().metadata.testsuite).toEqual('unknown');
    expect(testcase.json().metadata.version).toEqual('unknown');
  });

  test('fail on attempt to add element to hit count', () => {
    expect(() =>
      testcase.add_array_element('some-hit-count', transform('bang'))
    ).toThrowError(new ToucaError('capture_type_mismatch', 'some-hit-count'));
  });

  test('fail on attempt to increment hit count of array', () => {
    expect(() => testcase.add_hit_count('some-array')).toThrowError(
      new ToucaError('capture_type_mismatch', 'some-array')
    );
  });

  test('tic without toc', () => {
    testcase.start_timer('some-tic');
    expect(
      testcase.json().metrics.findIndex((v) => v.key === 'some-tic')
    ).toEqual(-1);
  });

  test('toc without tic', () => {
    testcase.stop_timer('some-toc');
    expect(
      testcase.json().metrics.findIndex((v) => v.key === 'some-toc')
    ).toEqual(-1);
  });

  test('hit count', () => {
    testcase.add_hit_count('some-hit-count');
    testcase.add_hit_count('some-other-hit-count');
    const find = (k: string) =>
      testcase.json().results.find((v) => v.key === k);
    expect(find('some-hit-count')?.value).toEqual(2);
    expect(find('some-other-hit-count')?.value).toEqual(1);
  });
});
