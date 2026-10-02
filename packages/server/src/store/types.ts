import { OrderChangeAction } from './enums.js';

export interface IStore<Item> {
  addAvailableItem(item: Item): void;
  addItemToSelection(item: Item): void;
  removeItemFromSelection(item: Item): void;
  getAvailableItems(criteria?: ItemsListCriteria<Item>): ItemListResult<Item>;
  getSelectionItems(criteria?: ItemsListCriteria<Item>): ItemListResult<Item>;
  changeSelectionOrder(op: SelectionOrderChangeOperation<Item>): void;
}

export type ItemListResult<T> = {
  items: T[];
  next: T | null;
};

export type ItemsListCriteria<T> = {
  search?: string;
  limit?: number;
  from?: T;
};

export type SelectionOrderChangeOperation<Item> = {
  type: OrderChangeAction.MoveHead;
  src: Item;
} | {
  type: OrderChangeAction.MoveTail;
  src: Item;
} | {
  type: OrderChangeAction.MoveAfter;
  src: Item;
  target: Item;
};