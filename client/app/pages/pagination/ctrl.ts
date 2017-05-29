import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { PagedData, PagedDataState } from '../../lib/services/paged-datasource';
import { TestDataItem, TestDataSourceService } from './datasource';
import { numResults, statusText } from '../../lib/actions/page';

import { AppState } from '../../reducers';
import { AutoUnsubscribe } from '../../lib/decorators/auto-unsubscribe';
import { PolymerForm } from '../../lib/components/polymer-form';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

/**
 * Test ctrl component
 */

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lib-test-ctrl',
  template: ''
})

@AutoUnsubscribe()
export class TestCtrlComponent implements OnChanges {

  @Input() filter: PolymerForm;
  @Input() state: PagedDataState;
  @Input() update: PolymerForm;

  @Output() loading = new EventEmitter<boolean>();
  @Output() saving = new EventEmitter<boolean>();

  page = new Subject<PagedData>();

  private loader: Subscription;
  private saver: Subscription;

  /** ctor */
  constructor(private store: Store<AppState>,
              private testData: TestDataSourceService) { }

  /** When the filter or state change */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter'] || changes['state'])
      this.load(!!changes['filter']);
    else if (changes['update'])
      this.save();
  }

  // private methods

  private newPage(page: PagedData) {
    this.page.next(page);
  }

  private load(reset: boolean) {
    if (this.filter && this.filter.submitted && this.state) {
      this.store.dispatch(statusText('Loading test data ... please standby'));
      this.loading.emit(true);
      // cancel any prior request
      if (this.loader)
        this.loader.unsubscribe();
      // issue a new load request
      this.loader = this.testData.load(this.state, this.filter.values, reset)
        .subscribe((page: PagedData) => {
          this.store.dispatch(numResults(page.maxItems));
          this.store.dispatch(statusText(''));
          this.loading.emit(false);
          this.newPage(page);
        });
    }
  }

  private save() {
    if (this.update && this.update.submitted) {
      this.store.dispatch(statusText(`Saving item ${this.update.values.id} ... please standby`));
      this.saving.emit(true);
      // cancel any prior request
      if (this.saver)
        this.saver.unsubscribe();
      // issue a new load request
      this.saver = this.testData.save(this.update.values)
        .subscribe((item: TestDataItem) => {
          this.saving.emit(false);
          this.load(false);
        });
    }
  }

}
