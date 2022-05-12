// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export class ApiKey {
  private _clean: string;
  private _shown = false;
  constructor(private readonly _key: string) {
    const parts = this._key.split('-');
    const middle = parts
      .splice(1, parts.length - 2)
      .map((v) => new Array(v.length + 1).join('*'));
    this._clean = [parts[0], ...middle, parts[parts.length - 1]].join('-');
  }
  toggle(): void {
    this._shown = !this._shown;
  }
  get plain(): string {
    return this._key;
  }
  get shown(): boolean {
    return this._shown;
  }
  get value(): string {
    return this._shown ? this._key : this._clean;
  }
}
