// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Decimal } from "decimal.js";

type Type =
  | boolean
  | bigint
  | number
  | string
  | Array<Type>
  | { [key: string]: Type };

type TypeComparison = {
  type:
    | "boolean"
    | "bigint"
    | "number"
    | "string"
    | "array"
    | "object"
    | "incompatible";
  match: boolean;
  score: number;
};

function isBoolean(value: Type): value is boolean {
  return typeof value === "boolean";
}

function isBigInt(value: Type): value is bigint {
  return typeof value === "bigint";
}

function isNumber(value: Type): value is number {
  return typeof value === "number";
}

function isString(value: Type): value is string {
  return typeof value === "string";
}

function isArray(value: Type): value is Array<Type> {
  return Array.isArray(value);
}

function isObject(value: Type): value is Record<string, Type> {
  return value !== null && typeof value === "object" && !isArray(value);
}

function flatten(input: Type): Map<string, Type> {
  let output = new Map<string, Type>();
  if (isObject(input)) {
    for (let [key, value] of Object.entries(input)) {
      let children = flatten(value);
      if (children.size > 0) {
        for (let [childKey, childValue] of children) {
          let separator = isArray(value) ? "" : ".";
          output.set(`${key}${separator}${childKey}`, childValue);
        }
      } else {
        output.set(key, value);
      }
    }
  } else if (isArray(input)) {
    for (let [index, value] of input.entries()) {
      let children = flatten(value);
      if (children.size > 0) {
        for (let [childKey, childValue] of children) {
          let separator = isArray(value) ? "" : ".";
          output.set(`[${index}]${separator}${childKey}`, childValue);
        }
      } else {
        output.set(`[${index}]`, value);
      }
    }
  }
  return output;
}

function compare(left: Type, right: Type): TypeComparison {
  if (isBoolean(left) && isBoolean(right)) {
    let match = left === right;
    let score = match ? 1 : 0;
    return { type: "boolean", match, score };
  }

  if (isBigInt(left) && isBigInt(right)) {
    let RATIO_THRESHOLD = 0.2;
    let x = new Decimal(left.toString());
    let y = new Decimal(right.toString());
    let difference = x.minus(y);
    let match = difference.isZero();
    let ratio = y.equals(0) ? 0 : difference.div(y).abs().toNumber();
    let score =
      !match || (ratio > 0 && ratio < RATIO_THRESHOLD) ? 1 - ratio : 1;
    return { type: "bigint", match, score };
  }

  if (isNumber(left) && isNumber(right)) {
    let RATIO_THRESHOLD = 0.2;
    let difference = left - right;
    let match = difference === 0;
    let ratio = right === 0 ? 0 : Math.abs(difference / right);
    let score =
      !match || (ratio > 0 && ratio < RATIO_THRESHOLD) ? 1 - ratio : 1;
    return { type: "number", match, score };
  }

  if (isString(left) && isString(right)) {
    let match = left === right;
    let score = match ? 1 : 0;
    return { type: "string", match, score };
  }

  if (isObject(left) && isObject(right)) {
    let flatLeft = flatten(left);
    let flatRight = flatten(right);
    let common = 0;
    let total = 0;
    for (let [key, value] of flatLeft) {
      total += 1;
      if (flatRight.has(key)) {
        let result = compare(value, flatRight.get(key)!);
        common += result.score;
      }
    }
    for (let key of flatRight.keys()) {
      if (!flatLeft.has(key)) {
        total += 1;
      }
    }
    let match = common === total;
    let score = common / total;
    return { type: "object", match, score };
  }

  if (isArray(left) && isArray(right)) {
    let RATIO_THRESHOLD = 0.2;
    let COUNT_THRESHOLD = 10;
    let flatLeft = Array.from(flatten(left).values());
    let flatRight = Array.from(flatten(right).values());
    let minLength = Math.min(flatLeft.length, flatRight.length);
    let maxLength = Math.max(flatLeft.length, flatRight.length);
    if (maxLength === 0) {
      return { type: "array", match: true, score: 1 };
    }
    let ratio = (maxLength - minLength) / maxLength;
    if (ratio > RATIO_THRESHOLD || flatLeft.length === 0) {
      return { type: "array", match: false, score: 0 };
    }
    let commonCount = 0;
    let diffCount = 0;
    let score = 0;
    for (let i = 0; i < minLength; i++) {
      let result = compare(flatLeft[i]!, flatRight[i]!);
      commonCount += result.score;
      if (!result.match) {
        diffCount += 1;
      }
    }
    let diffRatio = diffCount / flatLeft.length;
    if (diffRatio < RATIO_THRESHOLD || diffCount < COUNT_THRESHOLD) {
      score = commonCount / maxLength;
    }
    let match = score === 1;
    return { type: "array", match, score };
  }

  return { type: "incompatible", match: false, score: 0 };
}

export { Type, TypeComparison, compare };
