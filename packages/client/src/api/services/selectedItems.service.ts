import { createIdempotencyKey } from '../../utils';
import { ApiService }           from '../ApiService';
import {
  ApiIntent,
  ListResponse,
  IListCriteria,
  SelectionOrderChangePayload }               from '../types';


export class SelectedItemsApiService extends ApiService {

  getSelectedItems(criteria: IListCriteria): ApiIntent<ListResponse> {
    const [ getList, abort ] = this.createGetIntent<ListResponse>('/items/selection', criteria);

    return [
      () => getList().then(({ data }) => data),
      abort,
    ];
  }

  addSelectedItem(value: number): ApiIntent<void> {
    const [ addItem, abort ] = this.createPostIntent<void>('/items/selection', { value });

    return [
      () => addItem().then(() => void(0)),
      abort,
    ];
  }

  removeSelectedItem(value: number): ApiIntent<void> {
    const [ removeItem, abort ] = this.createDeleteIntent<void>(`/items/selection/${value}`);

    return [
      () => removeItem().then(() => void(0)),
      abort,
    ];
  }

  changeSelectionOrder(change: SelectionOrderChangePayload): ApiIntent<void> {
    const [ changeOrder, abort ] = this.createPostIntent<void>('/items/selection/order', change);

    return [
      () => changeOrder().then(() => void(0)),
      abort,
    ];
  }
}