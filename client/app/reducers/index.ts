import * as gpio from './gpio-pins';
import * as navigator from '../lib/reducers/navigator';
import * as router from '@ngrx/router-store';
import * as window from '../lib/reducers/window';

export const reducers = {
  gpio: gpio.reducer,
  router: router.routerReducer,
  navigator: navigator.reducer,
  window: window.reducer
};

export interface AppState {
  gpio: gpio.GPIOPinsState;
  navigator: navigator.NavigatorState;
  router: router.RouterState;
  window: window.WindowState;
}
