import { FetchHttpClient }          from './api';
import { AvailableItemsApiService } from './api/services/availableItems.service';
import { SelectedItemsApiService }  from './api/services/selectedItems.service';


const API_BASE = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const httpClient = new FetchHttpClient({ baseUrl: `${API_BASE}/api` });

export const AvailableItemsService = new AvailableItemsApiService(httpClient);
export const SelectedItemsService = new SelectedItemsApiService(httpClient);
