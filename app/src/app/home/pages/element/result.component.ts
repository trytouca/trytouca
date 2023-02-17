// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

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
import {
  Diff,
  DIFF_DELETE,
  DIFF_INSERT,
  diff_match_patch
} from 'diff-match-patch';
import { nanoid } from 'nanoid';
import { IClipboardResponse } from 'ngx-clipboard';

import type { FrontendElementCompareParams } from '@/core/models/frontendtypes';
import { NotificationService } from '@/core/services';
import { Icon, IconColor, IconType } from '@/home/models/page-item.model';
import { AlertType } from '@/shared/components/alert.component';
import { Checkbox2 } from '@/shared/components/checkbox2.component';

import { ElementPageResult } from './element.model';
import { ElementPageService } from './element.service';

type MatchType = 'irrelevant' | 'different' | 'imperfect' | 'perfect';

type DiffLine = { blocks: { operation: 'eq' | 'ins' | 'del'; text: string }[] };

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
  inlineDiff: Checkbox2;
  diffLines: DiffLine[];

  toggleInlineDiff(_: Checkbox2) {
    this.inlineDiff.value = !this.inlineDiff.value;
  }

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
    this.inlineDiff = {
      slug: nanoid(),
      default: 0.7 < result.data.score
    };
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
      return (
        type === 'array' ||
        type === 'object' ||
        type === 'buffer' ||
        (type === 'string' && 20 < value?.length)
      );
    };
    return (
      isTypeComplex(result.srcType, result.srcValue) ||
      isTypeComplex(result.dstType ?? result.srcType, result.dstValue)
    );
  }

  public toggleComplexView() {
    this.hideComplexValue = !this.hideComplexValue;
  }

  parseComplexValue(type: string, value: string): string {
    try {
      return type === 'string'
        ? JSON.parse(value)
        : JSON.stringify(JSON.parse(value), null, 2);
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

  public makeDiffOutput(mode: 'inline' | 'left' | 'right') {
    if (!this.diffLines) {
      const left = this.parseComplexValue(
        this.result.srcType,
        this.result.srcValue
      );
      const right = this.parseComplexValue(
        this.result.dstType ?? this.result.srcType,
        this.result.dstValue
      );
      const dmp = new diff_match_patch();
      const diffObjects = dmp.diff_main(right, left);
      dmp.diff_cleanupSemantic(diffObjects);
      this.diffLines = this.transformDiffObjects(diffObjects);
    }
    return this.prettyPrintDiff(this.diffLines, mode);
  }

  private transformDiffObjects(items: Diff[]): DiffLine[] {
    const escape = (v: string): string =>
      v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const code = (o: number) =>
      o === DIFF_INSERT ? 'ins' : o === DIFF_DELETE ? 'del' : 'eq';
    const tokens = items.flatMap(([op, text]) =>
      text
        .split(/\n/g)
        .flatMap((v) => {
          return [
            [code(op), escape(v)],
            [code(op), '<br>']
          ] as ['eq' | 'ins' | 'del', string][];
        })
        .slice(0, -1)
    );
    // convert to lines
    const lines: DiffLine[] = [];
    let blocks: DiffLine['blocks'] = [];
    for (const [op, v] of tokens) {
      if (v === '<br>') {
        lines.push({ blocks });
        blocks = [];
      } else {
        blocks.push({ operation: op, text: v });
      }
    }
    lines.push({ blocks });
    return lines;
  }

  private prettyPrintDiff(
    items: DiffLine[],
    mode: 'inline' | 'left' | 'right'
  ) {
    return items
      .map((line: DiffLine) => {
        const bg = line.blocks.every((v) => v.operation === 'eq')
          ? 'wsl-diff-line wsl-diff-line-none'
          : mode !== 'left' && line.blocks.every((v) => v.operation !== 'del')
          ? 'wsl-diff-line wsl-diff-line-green'
          : mode !== 'right' && line.blocks.every((v) => v.operation !== 'ins')
          ? 'wsl-diff-line wsl-diff-line-red'
          : 'wsl-diff-line wsl-diff-line-mixed';
        const fg = line.blocks.map((block) =>
          block.operation === 'ins' && mode !== 'left'
            ? `<ins>${block.text}</ins>`
            : block.operation === 'del' && mode !== 'right'
            ? `<del>${block.text}</del>`
            : block.operation === 'eq'
            ? `<span>${block.text}</span>`
            : ''
        );
        return `<div class="${bg}">${fg.join('')}</div>`;
      })
      .join('');
  }
}
