/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Subject } from 'rxjs';

/**
 *
 */
export abstract class IPageService<T> {
  protected _items: T[];
  protected _itemsSubject = new Subject<T[]>();
  public items$ = this._itemsSubject.asObservable();

  protected constructor() {}

  /**
   *
   */
  public abstract fetchItems(args?: object): void;

  /**
   *
   */
  public hasData() {
    return this._items !== undefined;
  }

  /**
   *
   */
  public countItems() {
    return this._items.length || 0;
  }
}
