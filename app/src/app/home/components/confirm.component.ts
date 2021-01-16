/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';
import { ModalComponent } from './modal.component';

export type ConfirmElements = {
  title: string
  message: string
  button: string
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
  constructor(
    public dialogRef: DialogRef
  ) {
    super();
    super.form = new FormGroup({});
    this.elements = dialogRef.data as ConfirmElements;
  }

  /**
   *
   */
  onSubmit(model: {}) {
    if (!this.form.valid) {
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
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape', 'Backspace'], event);
  }

}
