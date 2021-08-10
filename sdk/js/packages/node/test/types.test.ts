// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import * as types from '../src/types';

class DateOfBirth {
  constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number
  ) {}
}

describe('basic operations', () => {
  const handler = new types.TypeHandler();
  test('check boolean type', () => {
    const val = handler.transform(true);
    expect(val.json()).toEqual(true);
  });
  test('check string type', () => {
    const val = handler.transform('some-string');
    expect(val.json()).toEqual('some-string');
  });
  test('check integer type', () => {
    const val = handler.transform(1);
    expect(val.json()).toEqual(1);
  });
  test('check number type', () => {
    const val = handler.transform(1.5);
    expect(val.json()).toEqual(1.5);
  });
  test('when empty', () => {
    const val = handler.transform([]);
    expect(val.json()).toEqual('[]');
  });
  test('with numbers', () => {
    const val = handler.transform([0, 1]);
    expect(val.json()).toEqual('[0,1]');
  });
  test('with strings', () => {
    const val = handler.transform(['cat', 'dog']);
    expect(val.json()).toEqual('["cat","dog"]');
  });
  test('with tuple', () => {
    const val = handler.transform(['cat', 1]);
    expect(val.json()).toEqual('["cat",1]');
  });
  test('with map', () => {
    const input = new Map([
      ['cat', 'felix'],
      ['dog', 'max']
    ]);
    const val = handler.transform(input);
    expect(val.json()).toEqual(
      '["[\\"cat\\",\\"felix\\"]","[\\"dog\\",\\"max\\"]"]'
    );
  });
  test('with set', () => {
    const val = handler.transform(new Set(['cat', 'dog', 'cat']));
    expect(val.json()).toEqual('["cat","dog"]');
  });
  test('with empty object', () => {
    const val = handler.transform({});
    expect(val.json()).toEqual('{}');
  });
  test('with named object', () => {
    const val = handler.transform(new DateOfBirth(2000, 1, 1));
    expect(val.json()).toEqual('{"year":2000,"month":1,"day":1}');
  });
  test('with unnamed object', () => {
    const val = handler.transform({ year: 2000, month: 1, day: 1 });
    expect(val.json()).toEqual('{"year":2000,"month":1,"day":1}');
  });
});

describe('custom serializer', () => {
  test('override default serialization', () => {
    const handler = new types.TypeHandler();
    handler.add_serializer(DateOfBirth.name, (x) => ({
      y: x.year,
      m: x.month,
      d: x.day
    }));
    const val = handler.transform(new DateOfBirth(2000, 1, 1));
    expect(val.json()).toEqual('{"y":2000,"m":1,"d":1}');
  });
});
