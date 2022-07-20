// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import type { BatchLookupResponse } from '@touca/api-schema';

import { ApiService } from '@/core/services';
import { ModalComponent } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

@Component({
  templateUrl: './seal.component.html'
})
export class BatchSealComponent extends ModalComponent {
  elements: { batch: BatchLookupResponse };

  constructor(private apiService: ApiService, public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({});
    this.elements = dialogRef.data as { batch: BatchLookupResponse };
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const url = [
      'batch',
      this.elements.batch.teamSlug,
      this.elements.batch.suiteSlug,
      this.elements.batch.batchSlug,
      'seal'
    ].join('/');
    this.apiService.post(url).subscribe({
      next: () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
  }

  public closeModal() {
    this.form.reset();
    this.submitted = false;
    this.dialogRef.close(false);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape', 'Backspace'], event);
  }
}
