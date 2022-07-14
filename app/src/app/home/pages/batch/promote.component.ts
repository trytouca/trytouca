// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, SecurityContext } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { BatchLookupResponse } from '@touca/api-schema';
import { MarkdownService, SECURITY_CONTEXT } from 'ngx-markdown';

import { ApiService } from '@/core/services';
import { ModalComponent } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

interface FormContent {
  reason: string;
}

@Component({
  templateUrl: './promote.component.html',
  providers: [
    MarkdownService,
    { provide: SECURITY_CONTEXT, useValue: SecurityContext.HTML }
  ]
})
export class BatchPromoteComponent extends ModalComponent {
  elements: { batch: BatchLookupResponse };
  preview = {
    showText: false,
    buttonText: 'Preview'
  };

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

  onSubmit(model: FormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { reason: model.reason ?? '' };
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
      error: (err: HttpErrorResponse) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
      }
    });
  }

  public togglePreview() {
    this.preview.showText = !this.preview.showText;
    this.preview.buttonText = this.preview.showText ? 'Edit' : 'Preview';
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
