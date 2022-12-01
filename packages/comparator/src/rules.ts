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
  let score = 1
  const desc: string[] = []
  const update = (condition: boolean, pass: string, fail: string) => {
    score = condition ? 1 : 0
    desc.push(condition ? pass : fail)
  }
  if (rule.mode === 'absolute' && rule.min) {
    const min = rule.min
    update(
      min <= src,
      `value ${src} passes minimum threshold of ${min}`,
      `value ${src} is smaller than minimum threshold of ${min}`
    )
  }
  if (rule.mode === 'absolute' && rule.max) {
    const max = rule.max
    update(
      src <= max,
      `value ${src} passes maximum threshold of ${max}`,
      `value ${src} is larger than maximum threshold of ${max}`
    )
  }
  if (rule.mode === 'relative' && rule.percent !== undefined) {
    const max = rule.max!
    update(
      ratio <= max,
      `difference ${diff} passes the ${max * 100}% maximum threshold`,
      `difference ${diff} is larger than the ${max * 100}% maximum threshold`
    )
  }
  if (rule.mode === 'relative' && rule.percent === undefined) {
    const max = rule.max!
    update(
      diff <= max,
      `difference ${diff} passes maximum threshold of ${max}`,
      `difference ${diff} is larger than maximum threshold of ${max}`
    )
  }
  return { score, desc }
}
