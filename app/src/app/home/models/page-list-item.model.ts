/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

/**
 *
 */
export class PageListItem<DataType, Category> {
  private _data: DataType;
  private _type: Category;

  /**
   *
   */
  public constructor(data: DataType, type: Category) {
    this._data = data;
    this._type = type;
  }

  /**
   *
   */
  public get data(): DataType {
    return this._data;
  }

  /**
   *
   */
  public get type(): Category {
    return this._type;
  }
}
