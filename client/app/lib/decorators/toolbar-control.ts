/**
 * Decorator to load controls into <lib-toolbar-controls> and hook into their events
 */

export function ToolbarControl(def: {
  checked?: boolean;
  icon?: string;
  order?: number;
  tag?: string;
  type: 'button' | 'checkbox' | 'toggle';
}) {

  /**
   * Build controls
   */

  function build(ctor, controls, handler) {
    let control = null;
    switch (def.type) {
      case 'button':
        control = document.createElement('paper-icon-button');
        control.icon = def.icon;
        control.addEventListener('click', handler);
        break;
      case 'checkbox':
        control = document.createElement('paper-checkbox');
        control.innerHTML = def.tag;
        control.addEventListener('checked-changed', handler);
        break;
      case 'toggle':
        control = document.createElement('paper-toggle-button');
        control.innerHTML = def.tag;
        control.addEventListener('checked-changed', handler);
        break;
    }
    control.className = ctor.name;
    if (def.checked)
      control.checked = true;
    if (def.order)
      control.style.order = def.order;
    controls.appendChild(control);
  }

  /**
   * Create ngOnDestroy
   */

  function destroy(ctor) {
    const ngOnDestroy = ctor.prototype.ngOnDestroy;
    // replace it with this one:
    ctor.prototype.ngOnDestroy = function () {
      // find the toolbar controls
      const controls = document.querySelector('#theToolbarControls');
      let control = null;
      while (control = controls.querySelector(`.${ctor.name}`))
        control.parentNode.removeChild(control);
      // execute the original ngOnDestroy
      if (ngOnDestroy
       && (typeof ngOnDestroy === 'function'))
        ngOnDestroy.apply(this, arguments);
    };
  }

  /**
   * Create ngAfterViewInit
   */

  function init(ctor, method) {
    const ngAfterViewInit = ctor.prototype.ngAfterViewInit;
    ctor.prototype.ngAfterViewInit = function () {
      const controls = document.querySelector('#theToolbarControls');
      const handler = event => method.apply(this, [event]);
      build(ctor, controls, handler);
      // execute the original ngAfterViewInit
      if (ngAfterViewInit
       && (typeof ngAfterViewInit === 'function'))
        ngAfterViewInit.apply(this, arguments);
    };
  }

  /**
   * Decorator itself
   */

  return function(target: Object,
                  propertyKey: string,
                  descriptor: TypedPropertyDescriptor<any>): any {
    const ctor = target['constructor'];
    init(ctor, descriptor.value);
    destroy(ctor);
    return descriptor;
  };

}
