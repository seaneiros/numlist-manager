import {
  ListResponse,
  IListCriteria }      from '../api';
import { IAjaxStatus } from '../utils';


export type ApiListLoader = (criteria: IListCriteria) => [ () => Promise<ListResponse>, () => void ];

export type ListType = 'available' | 'selected';

export interface ICursorList {
  items: number[];
  next: number | null;
  search: string;
  ready: boolean;
  status: IAjaxStatus;
}

export interface IListsState {
  available: ICursorList;
  selected: ICursorList;
  loadMore(): Promise<void>;
  reset(search?: string): Promise<void>;
}

export interface IAvailableItemsStore extends ICursorList {
  loadMore(): () => void;
  reset(search?: string): void;
  removeItem(value: number): void;
  /** Returns a deselected item to the loaded list when it belongs there. */
  addItem(value: number): void;
}

export interface ISelectedItemsStore extends ICursorList {
  loadMore(): () => void;
  reset(search?: string): void;
  addItem(value: number): Promise<void>;
  removeItem(value: number): Promise<void>;
  moveItem(src: number, target: number): Promise<void>;
}
