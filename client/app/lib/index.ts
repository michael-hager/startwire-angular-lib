import * as lib from './';

import {CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule} from '@angular/core';

import { Cloudinary } from 'cloudinary-core';
import { CloudinaryModule } from '@cloudinary/angular';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';

/**
 * pi-lib module definition
 *
 * import { PiModule } from 'pi-lib';
 *
 * @NgModule({ ... imports: [PiModule, ...] ...})
 */

export * from './components/no-data-on-page';
export * from './components/polymer-app';
export * from './components/sidebar';
export * from './pipes/breakable';
export * from './pipes/ellipsize';
export * from './pipes/jsonify';
export * from './services/env';
export * from './utils';

const DECLARATIONS = [
  lib.BreakablePipe,
  lib.EllipsizePipe,
  lib.JSONifyPipe,
  lib.NoDataOnPageComponent,
  lib.PolymerAppComponent,
  lib.SidebarComponent,
  lib.SidebarGroupComponent
];

const PROVIDERS = [
  lib.EnvService
];

@NgModule({

  declarations: [
    ...DECLARATIONS
  ],

  exports: [
    ...DECLARATIONS
  ],

  imports: [
    CloudinaryModule.forRoot({Cloudinary: Cloudinary}, {
      cloud_name: 'mflo999'
    }),
    CommonModule,
    FlexLayoutModule,
    RouterModule
  ],

  providers: [
    ...PROVIDERS
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})

export class PiModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PiModule,
      providers: [
        ...PROVIDERS
      ]
    };
  }
}
