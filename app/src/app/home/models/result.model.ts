/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

/**
 *
 */
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
