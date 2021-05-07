/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { BatchLookupResponse } from '@weasel/core/models/commontypes';
import { ApiService } from '@weasel/core/services';
import { ModalComponent } from '@weasel/home/components';
import { AlertType } from '@weasel/shared/components/alert.component';

@Component({
  templateUrl: './seal.component.html'
})
export class BatchSealComponent extends ModalComponent {
  elements: { batch: BatchLookupResponse };

  /**
   *
   */
  constructor(private apiService: ApiService, public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({});
    this.elements = dialogRef.data as { batch: BatchLookupResponse };
  }

  /**
   *
   */
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
    this.apiService.post(url).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    );
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
