// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Injectable,
  Input,
  PLATFORM_ID
} from '@angular/core';

@Injectable()
export class CustomRenderer {
  constructor(@Inject(PLATFORM_ID) private platformId: unknown) {}

  invokeElementMethod(ref: ElementRef<HTMLInputElement>, method: 'focus') {
    if (isPlatformBrowser(this.platformId)) {
      ref.nativeElement[method]();
    }
  }
}

@Directive({
  providers: [CustomRenderer],
  selector: '[wslAutofocus]'
})
export class AutofocusDirective implements AfterViewInit {
  private _autofocus = true;

  constructor(
    private element: ElementRef<HTMLInputElement>,
    private renderer: CustomRenderer
  ) {}

  ngAfterViewInit() {
    if (this._autofocus) {
      this.renderer.invokeElementMethod(this.element, 'focus');
    }
  }

  @Input() set autofocus(condition: boolean) {
    this._autofocus = condition != false;
  }
}
