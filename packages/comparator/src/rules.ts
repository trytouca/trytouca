// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { Message } from '@touca/flatbuffers'

type Rule = Message['results'][0]['rule']

export function checkRuleNumber(
  src: number,
  dst: number,
  rule: NonNullable<Rule>
) {
  const diff = src - dst
  const ratio = dst === 0 ? 0 : Math.abs(diff / dst)
  const update = (failCondition: boolean, fail: string, pass: string) => {
    return failCondition
      ? { score: 0, desc: [fail] }
      : { score: 1, desc: [pass] }
  }
  if (rule.mode === 'absolute' && rule.min) {
    const min = rule.min
    return update(
      src < min,
      `value ${src} is smaller than minimum threshold of ${min}`,
      `value ${src} passes minimum threshold of ${min}`
    )
  }
  if (rule.mode === 'absolute' && rule.max) {
    const max = rule.max
    return update(
      max < src,
      `value ${src} is larger than maximum threshold of ${max}`,
      `value ${src} passes maximum threshold of ${max}`
    )
  }
  if (rule.mode === 'relative' && rule.percent !== undefined) {
    const max = rule.max!
    return update(
      max < ratio,
      `difference ${diff} is larger than the ${max * 100}% maximum threshold`,
      `difference ${diff} passes the ${max * 100}% maximum threshold`
    )
  }
  if (rule.mode === 'relative' && rule.percent === undefined) {
    const max = rule.max!
    return update(
      max < diff,
      `difference ${diff} is larger than maximum threshold of ${max}`,
      `difference ${diff} is within maximum threshold of ${max}`
    )
  }
}
