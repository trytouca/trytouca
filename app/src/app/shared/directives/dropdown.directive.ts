// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[wslDropdown]'
})
export class DropdownDirective implements AfterViewInit {
  private _isOpen = false;
  private _menu: Element;
  private _toggle: Element;

  constructor(private element: ElementRef, private renderer: Renderer2) {}

  private collapse() {
    this.renderer.addClass(this._menu, 'hidden');
    this.renderer.setAttribute(this._toggle, 'aria-expanded', 'false');
    this._isOpen = false;
  }

  private expand() {
    this.renderer.removeClass(this._menu, 'hidden');
    this.renderer.setAttribute(this._toggle, 'aria-expanded', 'true');
    this._menu.querySelectorAll('.wsl-dropdown-item').forEach((item) => {
      this.renderer.listen(item, 'click', () => {
        this.collapse();
      });
    });
    this._isOpen = true;
  }

  private toggleMenu() {
    if (this._isOpen) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  ngAfterViewInit() {
    const nativeElement = this.element.nativeElement as Element;
    if (!nativeElement) {
      return;
    }
    this._menu = nativeElement.querySelector('.wsl-dropdown-menu');
    if (!this._menu) {
      return;
    }
    this._toggle = nativeElement.querySelector('.wsl-dropdown-toggle');
    if (!this._toggle) {
      return;
    }
    this.renderer.addClass(nativeElement, 'relative');
    this.renderer.listen(this._toggle, 'click', () => {
      this.toggleMenu();
    });
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this._isOpen) {
      return;
    }
    const nativeElement = this.element.nativeElement as HTMLElement;
    const targetElement = event.target as HTMLElement;
    if (targetElement && !nativeElement.contains(targetElement)) {
      this.collapse();
    }
  }
}
