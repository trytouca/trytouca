// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IClipboardResponse } from 'ngx-clipboard';
import { timer } from 'rxjs';

import { ElementListResponseItem } from '@/core/models/commontypes';
import { Topic, TopicType } from '@/home/models/page-item.model';
import { DateTimePipe } from '@/shared/pipes';

import { SuitePageElement } from './suite.model';

@Component({
  selector: 'app-suite-item-case',
  templateUrl: './case.component.html',
  providers: [DateTimePipe]
})
export class SuiteItemCaseComponent {
  data: ElementListResponseItem;
  shownTopics: Topic[] = [];
  copyClass = [];

  constructor(private dateTimePipe: DateTimePipe) {}

  @Input()
  set item(item: SuitePageElement) {
    this.data = item.data;
    const topics: Topic[] = [];
    if (item.data.metricsDuration) {
      topics.push({
        color: ['text-green-600'],
        icon: 'hero-clock',
        text: this.dateTimePipe.transform(
          item.data.metricsDuration,
          'duration'
        ),
        type: TopicType.Performance
      });
    }
    this.shownTopics = topics;
  }

  @Output() updateMetadata = new EventEmitter<ElementListResponseItem>();

  addTag(name: string) {
    this.data.tags.push(name);
    this.updateMetadata.emit(this.data);
  }

  removeTag(name: string) {
    const index = this.data.tags.findIndex((v) => v === name);
    this.data.tags.splice(index, 1);
    this.updateMetadata.emit(this.data);
  }

  onCopy(event: IClipboardResponse) {
    this.copyClass.push('text-green-700');
    timer(1000).subscribe(() => (this.copyClass = []));
  }

  showForm() {
    this.data.note = 'some text';
    this.updateMetadata.emit(this.data);
  }

  removeNote() {
    this.data.note = undefined;
    this.updateMetadata.emit(this.data);
  }
}
