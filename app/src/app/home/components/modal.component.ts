/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Alert } from '@weasel/shared/components/alert.component';

@Component({
  template: ''
})
export class ModalComponent {

  public alert: Alert;
  protected submitted: boolean;
  public form: FormGroup;

  /**
   *
   */
  public shouldHideAriaDescription(field: string): boolean {
    return (!this.submitted && this.form.controls[field].pristine) ||
        this.form.controls[field].valid;
  }

  /**
   *
   */
  protected keydownGuard(keys: string[], event: KeyboardEvent) {
    if (keys.includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }

}
