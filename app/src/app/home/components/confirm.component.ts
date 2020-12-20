/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from './modal.component';

export type ConfirmElements = {
  title: string
  message: string
  button: string
};

@Component({
  selector: 'app-home-confirm',
  templateUrl: './confirm.component.html'
})
export class ConfirmComponent extends ModalComponent {

  public elements: ConfirmElements;

  /**
   *
   */
  constructor(
    public activeModal: NgbActiveModal,
  ) {
    super();
    super.form = new FormGroup({});
  }

  /**
   *
   */
  async onSubmit(model: {}) {
    if (!this.form.valid) {
      return;
    }
    this.submitted = true;
    this.form.reset();
    this.submitted = false;
    this.activeModal.close(true);
  }

  /**
   *
   */
  public closeModal() {
    this.form.reset();
    this.submitted = false;
    this.activeModal.close(false);
  }

  /**
   *
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    super.keydownGuard(['j', 'k', 'Enter', 'Escape', 'Backspace'], event);
  }

}
