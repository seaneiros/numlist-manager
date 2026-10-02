import { ApiService } from '../ApiService';
import {
  ListResponse,
  IListCriteria,
  ApiIntent}     from '../types';


export class AvailableItemsApiService extends ApiService {

  getAvailableItems(criteria: IListCriteria): ApiIntent<ListResponse> {
    const [ getList, abort ] = this.createGetIntent<ListResponse>('/items', criteria);

    return [
      () => getList().then(({ data }) => data),
      abort,
    ];
  }
}