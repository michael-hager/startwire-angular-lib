import { AfterContentInit } from '@angular/core';
import { AutoUnsubscribe } from '../decorators/auto-unsubscribe';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ContentChildren } from '@angular/core';
import { Directive } from '@angular/core';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { HostListener } from '@angular/core';
import { Input } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { OnDestroy } from '@angular/core';
import { QueryList } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

/**
 * pi-polymer-form model
 */

export class PolymerForm {
  isValid = false;
  submitted = false;
  validities = new PolymerFormValiditiesMap();
  values = new PolymerFormValuesMap();
}

export class PolymerFormValiditiesMap {
  [s: string]: boolean;
}

export class PolymerFormValuesMap {
  [s: string]: boolean | number | string;
}

/**
 * piPolymerControl directive
 *
 * NOTE: we place this before the pi-form component to make its QueryList work
 *
 * NOTE: Angular components that wrap Polymer components (like pi-multi-selector)
 * are obliged to expose an <input type=hidden> via element.nativeElement._proxy.
 */

enum Control {CHECKBOX, COMBOBOX, DATE, HIDDEN, INPUT, MULTI, RADIO, SLIDER, TOGGLE}

type ListenerCallback = (control: PolymerControlDirective) => void;

@Directive ({
  selector: '[piPolymerControl]'
})

export class PolymerControlDirective implements OnDestroy {
  @Input('default') dflt: boolean | number | string;
  @Input() name: string;
  @Input() sticky: boolean;

  private ctrl: Control;
  private el: any;
  private evtNames: string[] = [];
  private listener: Function;

  // private methods
  private static isEmpty(value: any) {
    return (value === undefined) || (value === null) || (value === '');
  }

  /** ctor */
  constructor(private element: ElementRef) {
    this.el = this.element.nativeElement;
    const tagName = this.el.tagName.toLowerCase();
    const type = this.el.type? this.el.type.toLowerCase() : null;
    if (tagName === 'paper-checkbox')
      this.ctrl = Control.CHECKBOX;
    else if (tagName === 'vaadin-combo-box')
      this.ctrl = Control.COMBOBOX;
    else if (tagName === 'vaadin-date-picker')
      this.ctrl = Control.DATE;
    else if ((tagName === 'paper-input')
          || (tagName === 'paper-textarea'))
      this.ctrl = Control.INPUT;
    else if ((tagName === 'input') && (type === 'hidden'))
      this.ctrl = Control.HIDDEN;
    else if (tagName === 'pi-multi-selector')
      this.ctrl = Control.MULTI;
    else if (tagName === 'paper-radio-group')
      this.ctrl = Control.RADIO;
    else if (tagName === 'paper-slider')
      this.ctrl = Control.SLIDER;
    else if (tagName === 'paper-toggle-button')
      this.ctrl = Control.TOGGLE;
    else throw new Error(`pi-polymer-form <${tagName}> not supported`);
  }

  /** Clear the control */
  clear() {
    switch (this.ctrl) {
      case Control.CHECKBOX:
        this.el.checked = false;
        break;
      case Control.COMBOBOX:
      case Control.DATE:
      case Control.HIDDEN:
      case Control.INPUT:
      case Control.SLIDER:
        this.el.value = null;
        break;
      case Control.MULTI:
        this.el._proxy.value = null;
        break;
      case Control.RADIO:
        this.el.selected = 0;
        break;
      case Control.TOGGLE:
        this.el.active = false;
        break;
    }
  }

  /** Give the control the focus */
  focus() {
    switch (this.ctrl) {
      case Control.CHECKBOX:
      case Control.DATE:
      case Control.RADIO:
      case Control.SLIDER:
      case Control.TOGGLE:
        this.el.focus();
        break;
      case Control.COMBOBOX:
      case Control.INPUT:
        this.el.focus();
        break;
      case Control.MULTI:
      case Control.HIDDEN:
        break;
    }
  }

  /** Is this control in a valid state? */
  isValid(): boolean {
    switch (this.ctrl) {
      case Control.CHECKBOX:
      case Control.DATE:
      case Control.RADIO:
      case Control.SLIDER:
      case Control.TOGGLE:
        return this.el.invalid !== true;
      case Control.COMBOBOX:
      case Control.HIDDEN:
      case Control.INPUT:
        // NOTE: the initial state of required fields may not set the invalid bit
        return (this.el.invalid !== true)
            && !(this.el.required && PolymerControlDirective.isEmpty(this.el.value));
      case Control.MULTI:
        return (this.el._proxy.invalid !== true)
            && !(this.el._proxy.required && PolymerControlDirective.isEmpty(this.el._proxy.value));
    }
  }

  /** Listen for changes */
  listen(callback: ListenerCallback) {
    if (!this.listener) {
      let evtNames: string[] = [];
      switch (this.ctrl) {
        case Control.CHECKBOX:
        case Control.COMBOBOX:
        case Control.SLIDER:
        case Control.TOGGLE:
          evtNames = ['change'];
          break;
        case Control.DATE:
          evtNames = ['value-changed'];
          break;
        case Control.MULTI:
        case Control.HIDDEN:
          evtNames = ['change'];
          break;
        case Control.INPUT:
          evtNames = ['value-changed', 'keydown'];
          break;
        case Control.RADIO:
          evtNames = ['paper-radio-group-changed'];
          break;
      }
      // stash the listener so we can unlisten
      this.evtNames = evtNames;
      this.listener = () => callback(this);
      this.evtNames.forEach(evtName => {
        // oh oh -- bit of a hack here
        if (this.el._proxy)
          this.el._proxy.addEventListener(evtName, this.listener);
        else this.el.addEventListener(evtName, this.listener);
      });
    }
  }

  /** Unlisten */
  unlisten() {
    if (this.listener) {
      this.evtNames.forEach(evtName => {
        // oh oh -- bit of a hack here
        if (this.el._proxy)
          this.el._proxy.removeEventListener(evtName, this.listener);
        else this.el.removeEventListener(evtName, this.listener);
      });
      this.listener = null;
    }
  }

  // property accessors / mutators

  get value(): boolean | number | string {
    switch (this.ctrl) {
      case Control.CHECKBOX:
        return this.el.checked;
      case Control.COMBOBOX:
      case Control.DATE:
      case Control.SLIDER:
        return this.el.value;
      case Control.HIDDEN:
        return this.el.value;
      case Control.INPUT:
        if (this.el.type === 'number')
          return PolymerControlDirective.isEmpty(this.el.value)? undefined : Number(this.el.value);
        else return this.el.value;
      case Control.MULTI:
        return this.el._proxy.value;
      case Control.RADIO:
        return this.el.selected;
      case Control.TOGGLE:
        return this.el.active;
    }
  }

  set value(data: boolean | number | string) {
    switch (this.ctrl) {
      case Control.CHECKBOX:
        this.el.checked = data;
        break;
      case Control.COMBOBOX:
      case Control.DATE:
      case Control.HIDDEN:
      case Control.SLIDER:
        this.el.value = data? data : null;
        break;
      case Control.INPUT:
        if (this.el.type === 'number')
          this.el.value = PolymerControlDirective.isEmpty(data)? null : Number(data);
        else this.el.value = data? data : null;
        break;
      case Control.MULTI:
        this.el._proxy.value = data? data : null;
        break;
      case Control.RADIO:
        this.el.selected = data;
        break;
      case Control.TOGGLE:
        this.el.active = data;
        break;
    }
  }

  // lifecycle methods

  ngOnDestroy() {
    this.unlisten();
  }

}

/**
 * pi-form component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'pi-polymer-form',
  styleUrls: ['polymer-form.less'],
  templateUrl: 'polymer-form.html'
})

@AutoUnsubscribe() 
export class PolymerFormComponent implements AfterContentInit {

  @ContentChildren(PolymerControlDirective) controls: QueryList<PolymerControlDirective>;

  @Input() focus: string;
  @Input() key: string;

  readonly stream = new EventEmitter<PolymerForm>();

  private controlByName = {};
  private model = new PolymerForm();
  private ready: boolean;
  private seed = new PolymerFormValuesMap();
  private subscription: Subscription;
  private timer = null;

  /** ctor */
  constructor(private lstor: LocalStorageService) { }

  /** Clear a control by name, and optionally give it the focus */
  clear(name: string,
        focus = true) {
    const control = this.controlByName[name];
    if (control) {
      control.clear();
      if (focus)
        control.focus();
    }
  }

  /** Get a control by name */
  get(name: string): boolean | number | string {
    const control = this.controlByName[name];
    return (control)? control.value : null;
  }

  /** Is this form in a valid state? */
  isValid(): boolean {
    return this.ready && this.controls.reduce((result, control) => {
      return result && control.isValid();
    }, true);
  }

  /** Reseed the form by finding every control's default or initial value */
  reseed() {
    this.controls.forEach((control: PolymerControlDirective) => {
      if (!this.seed[control.name] && this.key && control.sticky)
        this.seed[control.name] = <any>this.lstor.get(`${this.key}.${control.name}`);
      if (!this.seed[control.name])
        this.seed[control.name] = control.dflt;
    });
  }

  /** Reset this form */
  reset() {
    this.controlByName = {};
    this.model = new PolymerForm();
    this.controls.forEach((control: PolymerControlDirective) => {
      control.value = this.seed[control.name];
      this.model.values[control.name] = control.value;
      this.model.validities[control.name] = control.isValid();
      if (control.name === this.focus)
        control.focus();
      this.controlByName[control.name] = control;
      control.listen(this.listener.bind(this));
    });
    this.model.isValid = this.isValid();
    this.next();
  }

  /** Set a control by name */
  set(name: string,
      value: boolean | number | string) {
    const control = this.controlByName[name];
    if (control)
      control.value = value;
  }

  /** Submit this form */
  submit() {
    this.model.isValid = this.isValid();
    this.model.submitted = true;
    this.next();
  }

  // listeners

  @HostListener('keydown', ['$event']) onKeyDown(event) {
    if (this.isValid()
     && (event.key === 'Enter')
     && (event.target.tagName.toLowerCase() !== 'paper-textarea')) {
      // we will have emitted data for the keydown inside whatever control
      // the user was in when they hit ENTER -- we don't need it now
      if (this.timer)
        clearTimeout(this.timer);
      this.submit();
    }
  }

  // lifecycle methods

  ngAfterContentInit() {
    this.reseed();
    this.reset();
    this.ready = true;
    // reset whenever the list changes
    this.subscription = this.controls.changes.subscribe(() => {
      this.reseed();
      this.reset();
    });
  }

  // private methods

  private listener(control: PolymerControlDirective) {
    // NOTE: we have to do this because some controls (like DATE)
    // don't set valid at the same time they set value
    this.timer = setTimeout(() => {
      this.model.isValid = this.isValid();
      this.model.submitted = false;
      this.model.values[control.name] = control.value;
      this.model.validities[control.name] = control.isValid();
      this.next();
      // make value sticky
      if (this.key && control.sticky && control.isValid())
        this.lstor.set(`${this.key}.${control.name}`, control.value);
    }, 0);
  }

  private next() {
    this.stream.emit(Object.assign({}, this.model));
  }

}