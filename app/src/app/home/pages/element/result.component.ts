// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faClipboard } from '@fortawesome/free-regular-svg-icons';
import {
  faCheckCircle,
  faCircle,
  faMinusCircle,
  faPlusCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { IClipboardResponse } from 'ngx-clipboard';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { NotificationService } from '@/core/services';
import { Result } from '@/home/models/result.model';
import { AlertType } from '@/shared/components/alert.component';

import { ElementPageItemType, ElementPageResult } from './element.model';

enum MatchType {
  Irrelevant = 1,
  Different,
  Imperfect,
  Perfect
}

enum RowType {
  Unknown = 1,
  Common_Perfect_Simple,
  Common_Perfect_Complex,
  Common_Imperfect_Simple,
  Common_Imperfect_Complex,
  Common_Different_Simple,
  Common_Different_Complex,
  Missing_Simple,
  Missing_Complex,
  Fresh_Simple,
  Fresh_Complex
}

interface Icon {
  color: string;
  type: IconProp;
}

interface IMetadata {
  icon: Icon;
  initialized: boolean;
  rowType: RowType;
}

@Component({
  selector: 'app-element-item-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss', '../../styles/item.component.scss']
})
export class ElementItemResultComponent {
  result: Result;
  category: ElementPageItemType;
  rowType = RowType;
  hideComplexValue = true;
  faClipboard = faClipboard;

  meta: IMetadata = {
    initialized: false
  } as IMetadata;

  @Input() params: FrontendElementCompareParams;

  @Input()
  set key(result: ElementPageResult) {
    this.result = new Result(result.data);
    this.category = result.type;
    this.initMetadata();
  }

  constructor(
    private notificationService: NotificationService,
    private faIconLibrary: FaIconLibrary
  ) {
    faIconLibrary.addIcons(
      faCircle,
      faCheckCircle,
      faTimesCircle,
      faPlusCircle,
      faMinusCircle
    );
  }

  private initMetadata(): void {
    this.meta.rowType = this.initRowType();
    this.meta.icon = this.icon();
    this.meta.initialized = true;
  }

  private initRowType() {
    const matchType = this.findMatchType();
    const isComplex = this.isComplex();
    switch (this.category) {
      case ElementPageItemType.Common:
        switch (matchType) {
          case MatchType.Perfect:
            return isComplex
              ? RowType.Common_Perfect_Complex
              : RowType.Common_Perfect_Simple;
          case MatchType.Imperfect:
            return isComplex
              ? RowType.Common_Imperfect_Complex
              : RowType.Common_Imperfect_Simple;
          case MatchType.Different:
            return isComplex
              ? RowType.Common_Different_Complex
              : RowType.Common_Different_Simple;
        }
        return RowType.Unknown;
      case ElementPageItemType.Fresh:
        return isComplex ? RowType.Fresh_Complex : RowType.Fresh_Simple;
      case ElementPageItemType.Missing:
        return isComplex ? RowType.Missing_Complex : RowType.Missing_Simple;
    }
    return RowType.Unknown;
  }

  private icon(): Icon {
    const matchType = this.findMatchType();
    if (matchType === MatchType.Perfect) {
      return { color: 'mediumseagreen', type: 'check-circle' };
    }
    if (matchType === MatchType.Imperfect) {
      return { color: 'darkorange', type: 'times-circle' };
    }
    if (matchType === MatchType.Different) {
      return { color: 'mediumvioletred', type: 'times-circle' };
    }
    if (this.category === ElementPageItemType.Fresh) {
      return { color: 'mediumseagreen', type: 'plus-circle' };
    }
    if (this.category === ElementPageItemType.Missing) {
      return { color: 'mediumvioletred', type: 'minus-circle' };
    }
    return { color: 'lightgray', type: 'circle' };
  }

  private findMatchType(): MatchType {
    const result = this.result;
    if (!('score' in result)) {
      return MatchType.Irrelevant;
    }
    if (result.dstType) {
      return MatchType.Different;
    }
    return result.score === 1 ? MatchType.Perfect : MatchType.Imperfect;
  }

  private isComplex(): boolean {
    const result = this.result;
    const isTypeComplex = (type: string, value: string) => {
      if (type === 'array' || type === 'object') {
        return true;
      }
      return type === 'string' && 20 < value.length;
    };
    if (result.srcType && isTypeComplex(result.srcType, result.srcValue)) {
      return true;
    }
    if (result.dstType && isTypeComplex(result.dstType, result.dstValue)) {
      return true;
    }
    return false;
  }

  public toggleComplexView() {
    this.hideComplexValue = !this.hideComplexValue;
  }

  public parseComplexValue(value: string) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  public onCopy(event: IClipboardResponse) {
    this.notificationService.notify(
      AlertType.Success,
      'Copied value to clipboard.'
    );
  }
}
