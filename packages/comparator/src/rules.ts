// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export type Type =
  | boolean
  | bigint
  | number
  | string
  | Array<Type>
  | Buffer
  | { [key: string]: Type }

type NumberRule =
  | { mode: 'absolute'; max?: number; min?: number }
  | { mode: 'relative'; max: number; percent?: number }
type ComparisonRuleInput = { type: 'number' } & NumberRule

export abstract class ComparisonRule {
  private _desc: string[] = []
  private _score = 1
  constructor(protected _rule: ComparisonRuleInput) {}
  abstract check(src: Type, dst: Type): void
  protected update(failCondition: boolean, fail: string, pass: string) {
    this._desc.push(failCondition ? fail : pass)
    if (failCondition) this._score = 0
  }
  get score() {
    return this._score
  }
  get desc() {
    return this._desc
  }
}

export class NumericComparisonRule extends ComparisonRule {
  constructor(rule: NumberRule) {
    super({ type: 'number', ...rule })
  }
  check(src: number, dst: number) {
    if (this._rule.type !== 'number') {
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
      const max = this._rule.max
      this.update(
        max < ratio,
        `difference ${diff} is larger than the ${max * 100}% maximum threshold`,
        `difference ${diff} passes the ${max * 100}% maximum threshold`
      )
    }
    if (this._rule.mode === 'relative' && !this._rule.percent) {
      const max = this._rule.max
      this.update(
        max < diff,
        `difference ${diff} is larger than maximum threshold of ${max}`,
        `difference ${diff} is within maximum threshold of ${max}`
      )
    }
  }
}
