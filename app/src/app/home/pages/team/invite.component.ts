/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

import { ApiService } from '@/core/services';
import { ModalComponent } from '@/home/components';
import { AlertType } from '@/shared/components/alert.component';

type IFormContent = {
  name: string;
  email: string;
};

@Component({
  templateUrl: './invite.component.html'
})
export class TeamInviteComponent extends ModalComponent {
  elements: { teamSlug: string };

  /**
   *
   */
  constructor(private apiService: ApiService, public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({
      name: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32)
        ],
        updateOn: 'blur'
      }),
      email: new FormControl('', {
        validators: [Validators.required, Validators.email],
        updateOn: 'blur'
      })
    });
    this.elements = dialogRef.data as { teamSlug: string };
  }

  /**
   *
   */
  onSubmit(model: IFormContent) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    const body = { email: model.email, fullname: model.name };
    const url = ['team', this.elements.teamSlug, 'invite'].join('/');
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
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Backspace'], event);
  }
}
