/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, Input } from '@angular/core';
import {
  FormGroup,
  FormControl,
  AbstractControl,
  ValidatorFn
} from '@angular/forms';
import { Observable, timer } from 'rxjs';
import { DialogRef } from '@ngneat/dialog';
import { AlertType } from '@weasel/shared/components/alert.component';
import { ModalComponent } from './modal.component';

export type ConfirmElements = {
  title: string;
  message: string;
  button: string;
  severity?: AlertType;
  confirmAction?: () => Observable<void>;
  confirmText?: string;
  onActionSuccess?: () => void;
  onActionFailure?: (err: unknown) => void;
};

@Component({
  selector: 'app-home-confirm',
  templateUrl: './confirm.component.html'
})
export class ConfirmComponent extends ModalComponent {
  @Input() elements: ConfirmElements;

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
  onSubmit() {
    if (!this.form.valid) {
      const errors = this.form.controls.confirmText.errors;
      this.alert = {
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
    this.alert = {
      type: AlertType.Info,
      text: 'We are working on your request.'
    };
    this.elements.confirmAction().subscribe(
      () => {
        this.alert = { type: AlertType.Success, text: 'Done.' };
        timer(1000).subscribe(() => this.dialogRef.close(true));
        if (this.elements.onActionSuccess) {
          this.elements.onActionSuccess();
        }
      },
      () => {
        this.alert = {
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
