/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener } from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  ValidatorFn
} from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { AlertType } from '@weasel/shared/components/alert.component';
import { Observable } from 'rxjs';
import { ModalComponent } from './modal.component';

export type ConfirmElements = {
  title: string;
  message: string;
  button: string;
  severity?: AlertType;
  confirmAction?: () => Observable<void>;
  confirmText?: string;
};

@Component({
  selector: 'app-home-confirm',
  templateUrl: './confirm.component.html'
})
export class ConfirmComponent extends ModalComponent {
  elements: ConfirmElements;

  /**
   *
   */
  constructor(public dialogRef: DialogRef) {
    super();
    super.form = new FormGroup({
      confirmText: new FormControl('', {
        updateOn: 'change',
        validators: [this.validator()]
      })
    });
    this.elements = dialogRef.data as ConfirmElements;
  }

  /**
   *
   */
  validator(): ValidatorFn {
    return (control: AbstractControl) => {
      if (!this.elements?.confirmText) {
        return null;
      }
      if (control.value === this.elements?.confirmText) {
        return null;
      }
      if (control.value === '') {
        return { error: 'Please feel in the form below.' };
      }
      return { error: 'Your input does not match the expected text.' };
    };
  }

  /**
   *
   */
  onSubmit(model: {}) {
    if (!this.form.valid) {
      const errors = this.form.controls.confirmText.errors;
      super.alert = {
        type: AlertType.Danger,
        text: 'error' in errors ? errors.error : ''
      };
      return;
    }
    this.form.reset();
    this.submitted = false;
    if (!this.elements.confirmAction) {
      this.dialogRef.close(true);
      return;
    }
    this.elements.confirmAction().subscribe(
      () => this.dialogRef.close(true),
      () => {
        super.alert = {
          type: AlertType.Danger,
          text: 'You no longer have permissions to perform this operation.'
        };
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
  lookupButtonClass() {
    return this.elements?.severity === AlertType.Danger
      ? 'wsl-btn-danger'
      : 'wsl-btn-dark';
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape', 'Backspace'], event);
  }
}
