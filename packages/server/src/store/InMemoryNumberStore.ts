import { UnhandledValueError }    from '@sorter/common';
import { OrderChangeAction }      from './enums.js';
import {
  IStore,
  ItemListResult,
  ItemsListCriteria,
  SelectionOrderChangeOperation } from './types.js';


export class InMemoryNumberStore implements IStore<number> {
  private static MIN_VALUE = 1;
  private static MAX_DEFAULT_VALUE = 1_000_000;
  private static DEFAULT_PAGE_SIZE = 20;

  private additionalItems: number[] = [];
  private selectedItems: Set<number> = new Set();
  private selectionOrder: number[] = [];

  private itemAvailable(item: number): boolean {
    return (item >= InMemoryNumberStore.MIN_VALUE && item <= InMemoryNumberStore.MAX_DEFAULT_VALUE) || this.additionalItems.includes(item);
  }

  private findSelectedItemIndex(value: number): number {
    if (!this.selectedItems.has(value)) {
      return -1;
    }

    return this.selectionOrder.findIndex(v => v === value);
  }

  private getMaxAvailableValue() {
    return Math.max(this.additionalItems.at(this.additionalItems.length - 1) ?? -1, InMemoryNumberStore.MAX_DEFAULT_VALUE);
  }

  private getSearchMatchingFunction(search: number | null) {
    let itemMatchesCriteria: (value: number) => boolean = () => true;

    if (search == null) {
      return itemMatchesCriteria;
    }

    if (isNaN(search)) {
      return () => false;
    }

    const rankFrom = Math.floor(Math.log10(search));
    const rankTo = Math.floor(Math.log10(this.getMaxAvailableValue()));
    const searchBorders: [number, number][] = [];

    for (let i = Math.max(rankFrom, 0); i <= rankTo; i++) {
      const multiplier = Math.pow(10, rankTo - i);

      searchBorders.push([ search * multiplier, (search + 1) * multiplier ])
    }

    itemMatchesCriteria = (value: number) => searchBorders.some(([ start, end ]) => value >= start && value < end);

    return itemMatchesCriteria;
  }

  addAvailableItem(item: number): void {
    if (item < InMemoryNumberStore.MIN_VALUE || item > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Invalid value: ${item}`);
    }

    if (this.itemAvailable(item)) {
      throw new Error(`Item already exists: ${item}`);
    }

    const lastItem = this.additionalItems.at(this.additionalItems.length - 1);
    this.additionalItems.push(item);

    if (lastItem != null && item < lastItem) {
      this.additionalItems.sort((a, b) => a - b);
    }
  }

  getAvailableItems(criteria: ItemsListCriteria<number> = { limit: InMemoryNumberStore.DEFAULT_PAGE_SIZE }): ItemListResult<number> {
    const result: number[] = [];
    const { from, limit, search } = criteria;

    const amount = (Math.max(limit ?? 0, 0) || InMemoryNumberStore.DEFAULT_PAGE_SIZE);
    let counter = amount + 1;

    const searchNumber = search ? Number(search) : null;

    if (searchNumber != null && isNaN(searchNumber)) {
      return {
        items: [],
        next: null,
      };
    }

    const startValue = (from ?? searchNumber) || InMemoryNumberStore.MIN_VALUE;
    const endValue = InMemoryNumberStore.MAX_DEFAULT_VALUE

    const itemMatchesCriteria = this.getSearchMatchingFunction(searchNumber);

    for (let i = startValue; i <= endValue; i++) {
      if (counter === 0) {
        break;
      }

      if (itemMatchesCriteria(i) && !this.selectedItems.has(i)) {
        result.push(i);
        counter--;
      }
    }

    if (counter !== 0) {
      for (const i of this.additionalItems) {
        if (counter === 0) {
          break;
        }

        if (i >= startValue && itemMatchesCriteria(i) && !this.selectedItems.has(i)) {
          result.push(i);
          counter--;
        }
      }
    }

    let nextItem: number | null = null;

    if (result.length > amount) {
      nextItem = result.pop() ?? null;
    }

    return {
      items: result,
      next: nextItem,
    };
  }

  addItemToSelection(item: number): void {
    if (!this.itemAvailable(item)) {
      throw new Error('Invalid item value');
    }

    if (this.selectedItems.has(item)) {
      throw new Error('Item already selected');
    }

    this.selectedItems.add(item);
    this.selectionOrder.push(item);
  }

  removeItemFromSelection(item: number): void {
    this.selectedItems.delete(item);

    const idx = this.selectionOrder.findIndex(val => val === item);

    if (idx !== -1) {
      this.selectionOrder.splice(idx, 1);
    }
  }

  getSelectionItems(criteria: ItemsListCriteria<number> = { limit: InMemoryNumberStore.DEFAULT_PAGE_SIZE }): ItemListResult<number> {
    const result: number[] = [];

    if (this.selectedItems.size === 0) {
      return {
        items: result,
        next: null,
      };
    }

    const { from, limit, search } = criteria;

    const amount = Math.max(limit ?? 0, 0) || InMemoryNumberStore.DEFAULT_PAGE_SIZE;
    let counter = amount + 1;
    const searchNumber = search ? Number(search) : null;

    if (searchNumber != null && isNaN(searchNumber)) {
      return {
        items: [],
        next: null,
      };
    }

    const startValue = from ?? this.selectionOrder[0];
    const startIdx = this.findSelectedItemIndex(startValue);

    if (startIdx === -1) {
      return {
        items: [],
        next: null,
      };
    }

    const endIdx = this.selectionOrder.length - 1;

    const itemMatchesCriteria = this.getSearchMatchingFunction(searchNumber);

    for (let i = startIdx; i <= endIdx; i++) {
      if (counter === 0) {
        break;
      }
      const item = this.selectionOrder[i];

      if (itemMatchesCriteria(item)) {
        result.push(item);
        counter--;
      }
    }

    let nextItem: number | null = null;

    if (result.length > amount) {
      nextItem = result.pop() ?? null;
    }

    return {
      items: result,
      next: nextItem,
    };
  }

  private moveToHead(item: number) {
    const idx = this.findSelectedItemIndex(item);

    if (idx === -1) {
      return;
    }

    this.selectionOrder.splice(idx, 1);
    this.selectionOrder.splice(0, 0, item);
  }

  private moveToTail(item: number) {
    const idx = this.findSelectedItemIndex(item);

    if (idx === -1) {
      return;
    }

    this.selectionOrder.splice(idx, 1);
    this.selectionOrder.push(item);
  }

  private moveSrcAfterTarget(src: number, target: number) {
    const srcIdx = this.findSelectedItemIndex(src);
    const targetIdx = this.findSelectedItemIndex(target);

    if (srcIdx === -1 || targetIdx === -1) {
      return;
    }

    this.selectionOrder.splice(srcIdx, 1);
    this.selectionOrder.splice(srcIdx < targetIdx ? targetIdx : targetIdx + 1, 0, src);
  }

  changeSelectionOrder(op: SelectionOrderChangeOperation<number>): void {
    const { type } = op;

    switch (type) {
      case OrderChangeAction.MoveHead: return this.moveToHead(op.src);
      case OrderChangeAction.MoveTail: return this.moveToTail(op.src);
      case OrderChangeAction.MoveAfter: return this.moveSrcAfterTarget(op.src, op.target);
      default: throw new UnhandledValueError(type);
    }
  }
}