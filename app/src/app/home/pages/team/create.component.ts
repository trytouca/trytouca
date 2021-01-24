/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  ChangeDetectionStrategy,
  Component,
  HostListener
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { ApiService } from '@weasel/core/services';
import { ModalComponent } from '@weasel/home/components';
import { AlertType } from '@weasel/shared/components/alert.component';

type IFormContent = {
  name: string;
  slug: string;
};

@Component({
  templateUrl: './create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamCreateSuiteComponent extends ModalComponent {
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
      slug: new FormControl('', {
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(32),
          Validators.pattern('[a-zA-Z][a-zA-Z0-9-]+')
        ],
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
    const body = { name: model.name, slug: model.slug.toLocaleLowerCase() };
    const url = ['suite', this.elements.teamSlug].join('/');
    this.apiService.post(url, body).subscribe(
      () => {
        this.form.reset();
        this.submitted = false;
        this.dialogRef.close(true);
      },
      (err) => {
        const msg = this.apiService.extractError(err, [
          [400, 'request invalid', 'Your request was rejected by the server.'],
          [400, 'suite already registered', 'This suite is already registered.']
        ]);
        this.alert = { type: AlertType.Danger, text: msg };
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
