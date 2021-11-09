// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { FormHints } from '@/core/models/form-hint';
import { Alert } from '@/shared/components/alert.component';

@Component({
  template: ''
})
export class ModalComponent {
  private _subHints: Subscription;
  public alert: Alert;
  public submitted: boolean;
  public form: FormGroup;
  public hints: FormHints;

  public subscribeHints(fields: string[]) {
    this._subHints = this.hints.subscribe(this.form, fields);
  }

  public unsubscribeHints() {
    this._subHints.unsubscribe();
  }

  public shouldHideAriaDescription(field: string): boolean {
    return (
      (!this.submitted && this.form.controls[field].pristine) ||
      this.form.controls[field].valid
    );
  }

  protected keydownGuard(keys: string[], event: KeyboardEvent) {
    if (keys.includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }
}
