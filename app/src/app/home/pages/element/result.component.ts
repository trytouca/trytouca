// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

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
import { TypeComparison } from '@touca/api-schema';
import { IClipboardResponse } from 'ngx-clipboard';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { NotificationService } from '@/core/services';
import { Icon, IconColor, IconType } from '@/home/models/page-item.model';
import { AlertType } from '@/shared/components/alert.component';

import { ElementPageResult } from './element.model';
import { ElementPageService } from './element.service';

type MatchType = 'irrelevant' | 'different' | 'imperfect' | 'perfect';

enum RowType {
  Unknown = 1,
  Common_Perfect_Simple,
  Common_Perfect_Complex,
  Common_Perfect_Image,
  Common_Imperfect_Simple,
  Common_Imperfect_Complex,
  Common_Imperfect_Image,
  Common_Different_Simple,
  Common_Different_Complex,
  Common_Accepted_Complex,
  Fresh_Simple,
  Fresh_Complex,
  Missing_Simple,
  Missing_Complex
}

@Component({
  selector: 'app-element-item-result',
  templateUrl: './result.component.html'
})
export class ElementItemResultComponent {
  result: TypeComparison;
  category: ElementPageResult['type'];
  rowType = RowType;
  hideComplexValue = true;
  faClipboard = faClipboard;

  meta: Partial<{
    icon: Icon;
    initialized: boolean;
    rowType: RowType;
  }> = {
    initialized: false
  };

  @Input() params: FrontendElementCompareParams;

  @Input()
  set key(result: ElementPageResult) {
    this.result = result.data;
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
    const hasRule = !!this.result.rule;
    switch (this.category) {
      case 'common':
        switch (matchType) {
          case 'perfect':
            return isBuffer
              ? RowType.Common_Perfect_Image
              : isComplex
              ? RowType.Common_Perfect_Complex
              : hasRule
              ? RowType.Common_Accepted_Complex
              : RowType.Common_Perfect_Simple;
          case 'imperfect':
            return isBuffer
              ? RowType.Common_Imperfect_Image
              : isComplex
              ? RowType.Common_Imperfect_Complex
              : RowType.Common_Imperfect_Simple;
          case 'different':
            return isComplex
              ? RowType.Common_Different_Complex
              : RowType.Common_Different_Simple;
        }
        return RowType.Unknown;
      case 'fresh':
        return isComplex ? RowType.Fresh_Complex : RowType.Fresh_Simple;
      case 'missing':
        return isComplex ? RowType.Missing_Complex : RowType.Missing_Simple;
    }
    return RowType.Unknown;
  }

  private icon(): Icon {
    const matchType = this.findMatchType();
    return matchType === 'perfect'
      ? {
          color: IconColor.Green,
          type: IconType.CheckCircle,
          tooltip: 'Identical'
        }
      : matchType === 'imperfect'
      ? {
          color: IconColor.Orange,
          type: IconType.TimesCircle,
          tooltip: 'Different'
        }
      : matchType === 'different'
      ? {
          color: IconColor.Red,
          type: IconType.TimesCircle,
          tooltip: 'Different'
        }
      : this.category === 'fresh'
      ? {
          color: IconColor.Green,
          type: IconType.PlusCircle,
          tooltip: 'New Key'
        }
      : this.category === 'missing'
      ? {
          color: IconColor.Red,
          type: IconType.MinusCircle,
          tooltip: 'Missing Key'
        }
      : { color: IconColor.Gray, type: IconType.Circle };
  }

  private findMatchType(): MatchType {
    return !('score' in this.result)
      ? 'irrelevant'
      : this.result.dstType
      ? 'different'
      : this.result.score == 1
      ? 'perfect'
      : 'imperfect';
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

  public parseComplexValue(type: string, value: string) {
    try {
      if (type === 'string') {
        return JSON.parse(value);
      }
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
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
