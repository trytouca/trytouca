// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { expect, test } from "vitest";
import { compare } from "./type";

test("boolean", () => {
  expect(compare(false, false)).toEqual({
    type: "boolean",
    match: true,
    score: 1,
  });

  expect(compare(false, true)).toEqual({
    type: "boolean",
    match: false,
    score: 0,
  });
});

test("bigint", () => {
  expect(compare(0n, 0n)).toEqual({
    type: "bigint",
    match: true,
    score: 1,
  });

  expect(compare(1n, 2n)).toEqual({
    type: "bigint",
    match: false,
    score: 1 / 2,
  });
});

test("number", () => {
  expect(compare(0, 0)).toEqual({
    type: "number",
    match: true,
    score: 1,
  });

  expect(compare(1, 2)).toEqual({
    type: "number",
    match: false,
    score: 1 / 2,
  });
});

test("string", () => {
  expect(compare("", "")).toEqual({
    type: "string",
    match: true,
    score: 1,
  });

  expect(compare("bar", "baz")).toEqual({
    type: "string",
    match: false,
    score: 0,
  });
});

test("object", () => {
  expect(
    compare(
      {
        foo: "bar",
      },
      {
        foo: "bar",
      }
    )
  ).toEqual({
    type: "object",
    match: true,
    score: 1,
  });

  expect(
    compare(
      {
        foo: "bar",
        baz: [42, "qux"],
      },
      {
        foo: "bar",
        baz: [42, "quux"],
      }
    )
  ).toEqual({
    type: "object",
    match: false,
    score: 2 / 3,
  });
});

test("array", () => {
  expect(compare(["foo", "bar"], ["foo", "bar"])).toEqual({
    type: "array",
    match: true,
    score: 1,
  });

  expect(
    compare(
      [
        42,
        ["foo", "bar"],
        {
          qux: ["qux"],
        },
      ],
      [
        42,
        ["foo", "baz"],
        {
          qux: ["quux"],
        },
      ]
    )
  ).toEqual({
    type: "array",
    match: false,
    score: 2 / 4,
  });
});

test("incompatible", () => {
  expect(compare({}, [])).toEqual({
    type: "incompatible",
    match: false,
    score: 0,
  });
});
