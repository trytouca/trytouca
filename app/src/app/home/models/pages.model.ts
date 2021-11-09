// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Subject } from 'rxjs';

/**
 *
 */
export abstract class IPageService<T> {
  protected _items: T[];
  protected _itemsSubject = new Subject<T[]>();
  public items$ = this._itemsSubject.asObservable();

  /**
   *
   */
  public abstract fetchItems(args?: Record<string, unknown>): void;

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
    return this._items?.length || 0;
  }
}
