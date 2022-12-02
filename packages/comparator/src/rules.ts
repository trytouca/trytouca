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
      `Value passes minimum threshold of ${min}.`,
      `Value is smaller than minimum threshold of ${min}.`
    )
  }
  if (rule.mode === 'absolute' && rule.max) {
    const max = rule.max
    update(
      src <= max,
      `Value passes maximum threshold of ${max}.`,
      `Value is larger than maximum threshold of ${max}.`
    )
  }
  if (rule.mode === 'relative' && rule.percent !== undefined) {
    const max = rule.max!
    update(
      ratio <= max,
      `Difference "${diff}" passes the ${max * 100}% maximum threshold.`,
      `Difference "${diff}" is larger than the ${max * 100}% maximum threshold.`
    )
  }
  if (rule.mode === 'relative' && rule.percent === undefined) {
    const max = rule.max!
    update(
      diff <= max,
      `Difference "${diff}" passes maximum threshold of ${max}.`,
      `Difference "${diff}" is larger than maximum threshold of ${max}.`
    )
  }
  return { score, desc }
}
