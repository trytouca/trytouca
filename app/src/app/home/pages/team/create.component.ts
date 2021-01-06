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
  slug: string;
};

enum Alerts {
  Success = 'alert-success',
  Danger = 'alert-danger'
}

@Component({
  templateUrl: './create.component.html'
})
export class TeamCreateSuiteComponent extends ModalComponent {

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
      slug: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32),
          Validators.pattern('[a-zA-Z][a-zA-Z0-9\-]+')
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
    const body = { name: model.name, slug: model.slug.toLocaleLowerCase() };
    const url = [ 'suite', this.teamSlug ].join('/');
    this.apiService.post(url, body).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.activeModal.close(true);
      },
      err => {
        const msg = this.apiService.extractError(err, [
          [ 400, 'request invalid', 'Your request was rejected by the server.' ],
          [ 400, 'suite already registered', 'This suite is already registered.' ],
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
