// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

import { BatchLookupResponse } from '@/core/models/commontypes';
import { ApiService } from '@/core/services';
import { ModalComponent } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

interface IFormContent {
  reason: string;
}

@Component({
  templateUrl: './promote.component.html'
})
export class BatchPromoteComponent extends ModalComponent {
  elements: { batch: BatchLookupResponse };

  /**
   *
   */
  constructor(private apiService: ApiService, public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({
      reason: new FormControl('', {
        validators: [Validators.maxLength(1000)],
        updateOn: 'blur'
      })
    });
    this.elements = dialogRef.data as { batch: BatchLookupResponse };
  }

  /**
   *
   */
  onSubmit(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { reason: model.reason || '' };
    const url = [
      'batch',
      this.elements.batch.teamSlug,
      this.elements.batch.suiteSlug,
      this.elements.batch.batchSlug,
      'promote'
    ].join('/');
    this.apiService.post(url, body).subscribe({
      next: () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
  }

  /**
   *
   */
  public closeModal() {
    this.form.reset();
    this.submitted = false;
    this.dialogRef.close(false);
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape', 'Backspace'], event);
  }
}
