/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from 'src/app/core/services';
import { ModalComponent } from 'src/app/home/components';

type IFormContent = {
  name: string;
  email: string;
};

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

@Component({
  templateUrl: './invite.component.html'
})
export class TeamInviteComponent extends ModalComponent {

  public teamSlug: string;

  /**
   *
   */
  constructor(
    public activeModal: NgbActiveModal,
    private apiService: ApiService
  ) {
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
        validators: [
          Validators.required,
          Validators.email
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
    const body = { email: model.email, fullname: model.name };
    const url = [ 'team', this.teamSlug, 'invite' ].join('/');
    this.apiService.post(url, body).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.activeModal.close(true);
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ]
        ]);
        this.alert = [Alerts.Danger, msg];
      }
    );
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Backspace'], event);
  }

}
