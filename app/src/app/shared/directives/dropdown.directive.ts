/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { AfterViewInit, Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[wslDropdown]'
})
export class DropdownDirective implements AfterViewInit {

  private _isOpen = false;
  private _menu: Element;
  private _toggle: Element;

  /**
   *
   */
  constructor(
    private element: ElementRef,
    private renderer: Renderer2) {
  }

  /**
   *
   */
  private toggleMenu() {
    const func = this._isOpen ? this.renderer.addClass : this.renderer.removeClass;
    func(this._menu, 'hidden');
    this.renderer.setAttribute(this._toggle, 'aria-expanded', this._isOpen ? 'false' : 'true');
    this._isOpen = !this._isOpen;
  }

  /**
   *
   */
  ngAfterViewInit() {
    const nativeElement = this.element.nativeElement as Element;
    if (!nativeElement) {
      return;
    }
    const menuRef = nativeElement.querySelector('.wsl-dropdown-menu');
    if (!menuRef) {
      return;
    }
    const toggleRef = nativeElement.querySelector('.wsl-dropdown-toggle');
    if (!toggleRef) {
      return;
    }
    this._menu = menuRef;
    this._toggle = toggleRef;
    this.renderer.addClass(nativeElement, 'relative');
    this.renderer.listen(menuRef, 'click', () => {
      this.toggleMenu();
    });
    this.renderer.listen(toggleRef, 'click', () => {
      this.toggleMenu();
    });
  }
}
