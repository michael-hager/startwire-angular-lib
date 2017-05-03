import { Component } from '@angular/core';
import { flyInOut } from '../../lib/animations';

/**
 * Pipes demo page
 */

@Component({
  animations: [flyInOut()],
  selector: 'pi-pipes-page',
  styleUrls: ['page.less'],
  templateUrl: 'page.html'
})

export class PipesPageComponent { }