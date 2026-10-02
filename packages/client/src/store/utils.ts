import { AjaxStatus }  from '../utils';
import { ICursorList } from './types';


export const createEmptyListState = (search = ''): ICursorList => ({
  items: [],
  next: null,
  search,
  ready: false,
  status: AjaxStatus.default(),
});

export type MoveAction =
  | { type: 'head'; src: number }
  | { type: 'after'; src: number; target: number }
  | { type: 'before'; src: number; target: number };

export function createMoveAction(visibleItems: number[], src: number, target: number, filtered: boolean): MoveAction | null {
  const from = visibleItems.indexOf(src);
  const to = visibleItems.indexOf(target);

  if (from === -1 || to === -1 || from === to) {
    return null;
  }

  if (to > 0) {
    return { type: 'after', src, target: from < to ? visibleItems[to] : visibleItems[to - 1] };
  }

  return filtered ? { type: 'before', src, target: visibleItems[0] } : { type: 'head', src };
}