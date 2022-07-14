// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { IClipboardResponse } from 'ngx-clipboard';
import { timer } from 'rxjs';

import { ElementListResponseItem } from '@touca/api-schema';
import { Topic, TopicType } from '@/home/models/page-item.model';
import { DateTimePipe } from '@/shared/pipes';

import { SuitePageElement } from './suite.model';

enum NoteType {
  ViewMode,
  EditMode
}

@Component({
  selector: 'app-suite-item-case',
  templateUrl: './case.component.html',
  providers: [DateTimePipe]
})
export class SuiteItemCaseComponent {
  data: ElementListResponseItem;
  shownTopics: Topic[] = [];
  copyClass = [];

  Math = Math;
  noteType = NoteType.ViewMode;
  NoteType = NoteType;
  formNote = new FormGroup({
    note: new FormControl('', { updateOn: 'change' })
  });

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

  switchToEditMode() {
    this.noteType = NoteType.EditMode;
    this.formNote.setValue({ note: this.data.note ?? '' });
  }

  updateEditable() {
    this.noteType = NoteType.ViewMode;
    this.data.note = this.formNote.value.note;
    this.updateMetadata.emit(this.data);
  }

  cancelEditable() {
    this.noteType = NoteType.ViewMode;
  }

  removeNote() {
    this.formNote.reset({ note: '' });
    this.updateEditable();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ('Escape' === event.key) {
      this.cancelEditable();
    }
    event.stopImmediatePropagation();
  }
}
