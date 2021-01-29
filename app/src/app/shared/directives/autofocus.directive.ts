/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import {
  AfterViewInit,
  Directive,
  ElementRef,
  Injectable,
  Inject,
  Input,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class CustomRenderer {
  constructor(@Inject(PLATFORM_ID) private platformId: unknown) {}

  invokeElementMethod(ref: ElementRef, method: string) {
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

  constructor(private element: ElementRef, private renderer: CustomRenderer) {}

  ngAfterViewInit() {
    if (this._autofocus) {
      this.renderer.invokeElementMethod(this.element, 'focus');
    }
  }

  @Input() set autofocus(condition: boolean) {
    console.log(condition);
    this._autofocus = condition != false;
  }
}
