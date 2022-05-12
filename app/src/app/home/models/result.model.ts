// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export class Result {
  name: string;
  srcType?: string;
  dstType?: string;
  srcValue?: string;
  dstValue?: string;
  score?: number;
  desc?: string[];

  public constructor(init?: Partial<Result>) {
    Object.assign(this, init);
  }
}
