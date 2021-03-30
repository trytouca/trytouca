/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  Validators,
  ValidatorFn,
  AbstractControl,
  FormGroup
} from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 *
 */
export class FormHint {
  private _text: string;
  private _type: string;

  /**
   *
   */
  constructor(
    private initial: string,
    private errorMap: { [key: string]: string } = {},
    private success?: string
  ) {
    this._text = initial;
    this._type = 'wsl-text-muted';
  }
  setError(key: string): void {
    if (key in this.errorMap) {
      this._text = this.errorMap[key];
      this._type = 'wsl-text-danger';
    }
  }
  setSuccess(): void {
    this._text = this.success ?? this.initial;
    this._type = this.success ? 'wsl-text-success' : 'wsl-text-muted';
  }
  unsetError(): void {
    this._text = this.initial;
    this._type = 'wsl-text-muted';
  }
  get text(): string {
    return this._text;
  }
  get type(): string {
    return this._type;
  }
}

/**
 *
 */
export type FormHintsSubscriptions<T> = Partial<Record<keyof T, Subscription>>;

/**
 *
 */
export type FormHints<T> = Record<keyof T, FormHint>;

/**
 *
 */
function updateFormHint(group: AbstractControl, hint: FormHint): Subscription {
  return group.statusChanges.subscribe(() => {
    if (!group.errors) {
      hint.setSuccess();
      return;
    }
    const errorTypes = Object.keys(group.errors);
    if (errorTypes.length === 0) {
      hint.unsetError();
      return;
    }
    hint.setError(errorTypes[0]);
  });
}

/**
 *
 */
export function subscribeToFormHints<T>(
  form: FormGroup,
  help: FormHints<T>,
  keys: Array<keyof T>
): FormHintsSubscriptions<T> {
  const subs: FormHintsSubscriptions<T> = {};
  keys.forEach((key) => {
    subs[key] = updateFormHint(form.get(key.toString()), help[key]);
  });
  return subs;
}

/**
 *
 */
export const formFields: Record<
  'fname' | 'email' | 'uname' | 'upass',
  { validators: ValidatorFn[]; validationErrors: Record<string, string> }
> = {
  fname: {
    validators: [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(128)
    ],
    validationErrors: {
      required: 'This field is required.',
      maxlength: 'Our engineers did not expect more than 128 characters.',
      minlength: 'This field cannot be empty.'
    }
  },
  email: {
    validators: [
      Validators.required,
      Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
    ],
    validationErrors: {
      required: 'This field is required',
      pattern: 'Please use a valid email address.'
    }
  },
  uname: {
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(32),
      Validators.pattern('[a-zA-Z0-9]+')
    ],
    validationErrors: {
      required: 'This field is required.',
      maxlength: 'Username can be at most 32 characters.',
      minlength: 'Username should be at least 3 characters.',
      pattern: 'Username can only contain alphanumeric characters.'
    }
  },
  upass: {
    validators: [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(64)
    ],
    validationErrors: {
      required: 'This field is required.',
      minlength: 'Password must be at least 8 characters.',
      maxlength: 'Password must be at most 64 characters.'
    }
  }
};
