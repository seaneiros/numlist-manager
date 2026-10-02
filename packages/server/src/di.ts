import { Time }                       from '@sorter/common';
import {
  AvailableItemsController,
  AvailableItemsListResponse }        from './controllers/index.js';
import { SelectedItemsController }    from './controllers/selectedItems/selectedItems.controller.js';
import { SelectedItemsListResponse }  from './controllers/selectedItems/selectedItems.dto.js';
import { AddAvailableItemWorker }     from './services/addAvailableItem.worker.js';
import { InMemoryNumberStore }        from './store/InMemoryNumberStore.js';
import { RequestCoalescer }           from './utils/coalescer.js';
import { IdempotencyStore }           from './utils/idempotency.store.js';
import { TaskQueue }                  from './utils/queue.js';
import { SelectionItemListWorker }    from './services/addSelectedItem.worker.js';
import { ChangeSelectionOrderWorker } from './services/changeSelectionOrder.worker.js';


export const idempotencyService = new IdempotencyStore();

const store = new InMemoryNumberStore();
const availableItemsListCoalescer = new RequestCoalescer<AvailableItemsListResponse>();
const selectedItemsListCoalescer = new RequestCoalescer<SelectedItemsListResponse>();

const addAvailableItemWorker = new AddAvailableItemWorker(new TaskQueue(), store, 10 * Time.Second);
const selectionItemListWorker = new SelectionItemListWorker(new TaskQueue(), store, 10 * Time.Second);
const changeSelectionOrderWorker = new ChangeSelectionOrderWorker(new TaskQueue(), store, Time.Second);

export const availableItemsController = new AvailableItemsController(store, availableItemsListCoalescer, addAvailableItemWorker);
export const selectedItemsController = new SelectedItemsController(store, selectedItemsListCoalescer, selectionItemListWorker, changeSelectionOrderWorker);
