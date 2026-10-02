import { create }                from 'zustand';
import { AvailableItemsService } from '../di';
import { IListCriteria }         from '../api';
import { AjaxStatus }            from '../utils';
import { ApiError }              from '@sorter/common';
import { IAvailableItemsStore }   from './types';
import { createEmptyListState }  from './utils';


export const AvailableItemsStore = create<IAvailableItemsStore>((set, get) => {

  const loadData = () => {
    const { search, next, ready } = get();
    const criteria: IListCriteria = {
      search,
      from: ready && next !== null ? next : undefined,
      limit: 20,
    };
    const [ load, abort ] = AvailableItemsService.getAvailableItems(criteria);

    set({ status: AjaxStatus.request() });

    load()
      .then(({ items, next }) => {
        set(state => ({
          items: [ ...state.items, ...items ],
          next,
          ready: true,
          status: AjaxStatus.success(),
        }));
      })
      .catch(err => {
        const e = err as ApiError;

        if (!e.cancelled) {
          set({ status: AjaxStatus.failure(e) });
        }
      });

      return abort;
  };

  return {
    ...createEmptyListState(),
    loadMore() {
      const { status, ready, next } = get();

      if (status.request || (ready && next === null)) return () => void(0);

      return loadData();
    },
    reset(search = get().search) {
      set(createEmptyListState(search));
      loadData();
    },
    removeItem(value) {
      set(state => ({ items: state.items.filter(item => item !== value) }));
    },
    addItem(value) {
      set(state => {
        const loaded = state.ready && (state.next === null || value < state.next);
        const matchSearch = String(value).startsWith(state.search);

        if (!loaded || !matchSearch || state.items.includes(value)) return state;

        const index = state.items.findIndex(item => item > value);

        return {
          items: index === -1
            ? [ ...state.items, value ]
            : [ ...state.items.slice(0, index), value, ...state.items.slice(index) ],
        };
      });
    },
  };
});