/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  ChangeDetectionStrategy,
  Component,
  HostListener
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  ValidatorFn
} from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { AlertType } from '@weasel/shared/components/alert.component';
import { ModalComponent } from './modal.component';

export type ConfirmElements = {
  title: string;
  message: string;
  button: string;
  severity?: AlertType;
  confirmText?: string;
};

@Component({
  selector: 'app-home-confirm',
  templateUrl: './confirm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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
    this.submitted = true;
    this.form.reset();
    this.submitted = false;
    this.dialogRef.close(true);
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
