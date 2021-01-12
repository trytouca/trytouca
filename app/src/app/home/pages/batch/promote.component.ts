/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { ApiService } from '@weasel/core/services';
import { BatchLookupResponse } from '@weasel/core/models/commontypes';
import { ModalComponent } from '@weasel/home/components';

interface IFormContent {
  reason: string;
}

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

@Component({
  selector: 'app-elements-promote',
  templateUrl: './promote.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BatchPromoteComponent extends ModalComponent {

  public batch: BatchLookupResponse;

  /**
   *
   */
  constructor(
    private apiService: ApiService,
    public dialogRef: DialogRef
  ) {
    super();
    super.form = new FormGroup({
      reason: new FormControl('', {
        validators: [
          Validators.maxLength(1000)
        ],
        updateOn: 'blur'
      })
    });
  }

  /**
   *
   */
  async onSubmit(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { reason: model.reason || '' };
    const url = [ 'batch', this.batch.teamSlug, this.batch.suiteSlug, this.batch.batchSlug, 'promote' ].join('/');
    this.apiService.post(url, body).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
        ]);
        this.alert = [Alerts.Danger, msg];
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
    super.keydownGuard(['j', 'k', 'p', 'Enter', 'Escape', 'Backspace'], event);
  }

}
