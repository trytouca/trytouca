// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';

import { ElementListResponseItem } from '@/core/models/commontypes';
import { DateTimePipe } from '@/shared/pipes';

type Data = {
  name: string;
};

@Component({
  selector: 'app-suite-item-case',
  templateUrl: './case.component.html',
  styleUrls: ['../../styles/item.component.scss'],
  providers: [DateTimePipe]
})
export class SuiteItemCaseComponent {
  data: Data;
  tags: { title: string }[] = [];

  constructor(private dateTimePipe: DateTimePipe) {}

  @Input()
  set item(item: ElementListResponseItem) {
    this.data = { name: item.name };
    this.tags.push({
      title: this.dateTimePipe.transform(item.metricsDuration, 'duration')
    });
  }
}
