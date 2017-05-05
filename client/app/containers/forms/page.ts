import { Component } from '@angular/core';
import { flyInOut } from '../../lib/animations';

/**
 * pi-polymer-form demo page
 */

@Component({
  animations: [flyInOut()],
  selector: 'pi-forms-page',
  styleUrls: ['page.less'],
  templateUrl: 'page.html'
})

export class FormsPageComponent { }
