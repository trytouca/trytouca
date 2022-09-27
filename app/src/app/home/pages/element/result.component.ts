// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
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
import { Icon, IconColor, IconType } from '@/home/models/page-item.model';
import { Result } from '@/home/models/result.model';
import { AlertType } from '@/shared/components/alert.component';

import { ElementPageItemType, ElementPageResult } from './element.model';
import { ElementPageService } from './element.service';

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
  Fresh_Complex,
  Common_Perfect_Image,
  Common_Imperfect_Image
}

interface IMetadata {
  icon: Icon;
  initialized: boolean;
  rowType: RowType;
}

@Component({
  selector: 'app-element-item-result',
  templateUrl: './result.component.html'
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
    private elementService: ElementPageService,
    private notificationService: NotificationService,
    faIconLibrary: FaIconLibrary
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
    const isBuffer = this.result.srcType === 'buffer';
    switch (this.category) {
      case ElementPageItemType.Common:
        switch (matchType) {
          case MatchType.Perfect:
            return isBuffer
              ? RowType.Common_Perfect_Image
              : isComplex
              ? RowType.Common_Perfect_Complex
              : RowType.Common_Perfect_Simple;
          case MatchType.Imperfect:
            return isBuffer
              ? RowType.Common_Imperfect_Image
              : isComplex
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
      return {
        color: IconColor.Green,
        type: IconType.CheckCircle,
        tooltip: 'Identical'
      };
    }
    if (matchType === MatchType.Imperfect) {
      return {
        color: IconColor.Orange,
        type: IconType.TimesCircle,
        tooltip: 'Different'
      };
    }
    if (matchType === MatchType.Different) {
      return {
        color: IconColor.Red,
        type: IconType.TimesCircle,
        tooltip: 'Different'
      };
    }
    if (this.category === ElementPageItemType.Fresh) {
      return {
        color: IconColor.Green,
        type: IconType.PlusCircle,
        tooltip: 'New Key'
      };
    }
    if (this.category === ElementPageItemType.Missing) {
      return {
        color: IconColor.Red,
        type: IconType.MinusCircle,
        tooltip: 'Missing Key'
      };
    }
    return { color: IconColor.Gray, type: IconType.Circle };
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
      if (type === 'array' || type === 'object' || type === 'buffer') {
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

  public getImagePath(side: 'src' | 'dst', name: string) {
    return this.elementService.getImagePath(side, name);
  }
}
