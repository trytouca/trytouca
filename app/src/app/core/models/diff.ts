// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import {
  Diff,
  DIFF_DELETE,
  DIFF_INSERT,
  diff_match_patch
} from 'diff-match-patch';

type DiffLine = { blocks: { operation: 'eq' | 'ins' | 'del'; text: string }[] };

export class DiffOutput {
  lines: DiffLine[];
  constructor(left: string, right: string) {
    const dmp = new diff_match_patch();
    const diffObjects = dmp.diff_main(right, left);
    dmp.diff_cleanupSemantic(diffObjects);
    this.lines = this.transform(diffObjects);
  }

  html(mode: 'inline' | 'left' | 'right'): string {
    return this.applyMode(mode)
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

  private applyMode(mode: 'inline' | 'left' | 'right') {
    const ops =
      mode === 'right' ? ['eq', 'ins'] : mode === 'left' ? ['eq', 'del'] : null;
    return ops
      ? this.lines.filter((line) =>
          line.blocks.some((v) => ops.includes(v.operation))
        )
      : this.lines;
  }

  private transform(items: Diff[]): DiffLine[] {
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
}
