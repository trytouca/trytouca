/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Pipe, PipeTransform } from '@angular/core';
import { humanizer, Unit } from 'humanize-duration';

const cls = humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms'
    }
  }
});

export function formatDuration(duration: number, largest = 1, units = ['s', 'ms']): string {
  const opts = {
    largest,
    round: true,
    spacer: '',
    units: units as Unit[]
  };
  return cls(Math.abs(duration), opts);
}

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {

  transform(duration: number, largest = 1, units = ['s', 'ms']): string {
    return formatDuration(duration, largest, units);
  }

}
