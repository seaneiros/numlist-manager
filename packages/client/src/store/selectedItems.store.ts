import { create }               from 'zustand';
import { SelectedItemsService } from '../di';
import { IListCriteria, SelectionOrderChangePayload }        from '../api';
import { AjaxStatus }           from '../utils';
import { ApiError }             from '@sorter/common';
import { ISelectedItemsStore }  from './types';
import { createEmptyListState, createMoveAction, MoveAction } from './utils';


export const SelectedItemsStore = create<ISelectedItemsStore>((set, get) => {

  const loadData = () => {
    const { search, next, ready } = get();
    const criteria: IListCriteria = {
      search,
      from: ready && next !== null ? next : undefined,
      limit: 20,
    };
    const [ load, abort ] = SelectedItemsService.getSelectedItems(criteria);

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
    async addItem(value) {
      const [ add ] = SelectedItemsService.addSelectedItem(value);

      await add();

      set(state => {
        const showInList = state.next === null && String(value).startsWith(state.search);

        return showInList && !state.items.includes(value) ? { items: [ ...state.items, value ] } : state;
      });
    },
    async removeItem(value) {
      const [ remove ] = SelectedItemsService.removeSelectedItem(value);

      await remove();

      set(state => ({ items: state.items.filter(item => item !== value) }));
    },
    async moveItem(src, target) {
      const { items, search } = get();
      const moveAction = createMoveAction(items, src, target, search !== '');

      if (!moveAction) {
        return;
      }

      set({ items: [ ...applyMoveAction(items, moveAction) ] });

      try {
        // a move may take several requests, they have to be applied in order
        for (const change of convertActionToApiPayload(moveAction)) {
          const [ changeOrder ] = SelectedItemsService.changeSelectionOrder(change);

          await changeOrder();
        }
      } catch (err) {
        set({ items });

        throw err;
      }
    },
  };
});


/* HELPERS */

function applyMoveAction(list: number[], move: MoveAction): number[] {
  const rest = list.filter(id => id !== move.src);

  if (rest.length === list.length) {
    return list;
  }

  if (move.type === 'head') {
    return [move.src, ...rest];
  }

  const targetIdx = rest.indexOf(move.target);

  if (targetIdx === -1) {
    return list;
  }

  const at = move.type === 'after' ? targetIdx + 1 : targetIdx;

  return [...rest.slice(0, at), move.src, ...rest.slice(at)];
}

function convertActionToApiPayload(move: MoveAction): SelectionOrderChangePayload[] {
  switch (move.type) {
    case 'head':
      return [{ src: move.src }];
    case 'after':
      return [{ src: move.src, target: move.target }];
    case 'before':
      return [
        { src: move.src, target: move.target },
        { src: move.target, target: move.src },
      ];
  }
}