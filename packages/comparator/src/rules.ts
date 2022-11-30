// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { Message } from '@touca/flatbuffers'

type Rule = Message['results'][0]['rule']
type Type = Message['results'][0]['value']

export abstract class ComparisonRule {
  private _desc: string[] = []
  private _score = 1
  constructor(protected _rule: Rule) {}
  abstract check(src: Type, dst: Type): void
  protected update(failCondition: boolean, fail: string, pass: string) {
    this._desc.push(failCondition ? fail : pass)
    this._score = failCondition ? 0 : 1
  }
  get desc() {
    return this._desc
  }
  get score() {
    return this._score
  }
}

export class ComparisonRuleDouble extends ComparisonRule {
  constructor(rule: Rule) {
    super(rule)
  }
  check(src: number, dst: number) {
    if (this._rule?.type !== 'number') {
      return
    }
    const diff = src - dst
    const ratio = dst === 0 ? 0 : Math.abs(diff / dst)
    if (this._rule.mode === 'absolute' && this._rule.min) {
      const min = this._rule.min
      this.update(
        src < min,
        `value ${src} is smaller than minimum threshold of ${min}`,
        `value ${src} passes minimum threshold of ${min}`
      )
    }
    if (this._rule.mode === 'absolute' && this._rule.max) {
      const max = this._rule.max
      this.update(
        max < src,
        `value ${src} is larger than maximum threshold of ${max}`,
        `value ${src} passes maximum threshold of ${max}`
      )
    }
    if (this._rule.mode === 'relative' && this._rule.percent) {
      const max = this._rule.max!
      this.update(
        max < ratio,
        `difference ${diff} is larger than the ${max * 100}% maximum threshold`,
        `difference ${diff} passes the ${max * 100}% maximum threshold`
      )
    }
    if (this._rule.mode === 'relative' && !this._rule.percent) {
      const max = this._rule.max!
      this.update(
        max < diff,
        `difference ${diff} is larger than maximum threshold of ${max}`,
        `difference ${diff} is within maximum threshold of ${max}`
      )
    }
  }
}

export function createRule(input: Rule): ComparisonRule | undefined {
  if (input?.type === 'number') {
    return new ComparisonRuleDouble(input)
  }
}
