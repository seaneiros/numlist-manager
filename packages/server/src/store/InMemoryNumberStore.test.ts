import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryNumberStore } from './InMemoryNumberStore.js';
import { OrderChangeAction } from './enums.js';

describe('InMemoryNumberStore', () => {
  let store: InMemoryNumberStore;

  beforeEach(() => {
    store = new InMemoryNumberStore();
  });

  const select = (...items: number[]) => items.forEach(i => store.addItemToSelection(i));
  const available = (criteria?: Parameters<InMemoryNumberStore['getAvailableItems']>[0]) => store.getAvailableItems(criteria).items;
  const selection = (criteria?: Parameters<InMemoryNumberStore['getSelectionItems']>[0]) => store.getSelectionItems(criteria).items;

  describe('addAvailableItem', () => {
    it('rejects values that already exist', () => {
      expect(() => store.addAvailableItem(5)).toThrow('Item already exists: 5');
    });

    it('rejects invalid values', () => {
      expect(() => store.addAvailableItem(0)).toThrow('Invalid value: 0');
    });

    it('honours `from` when listing added values', () => {
      store.addAvailableItem(1_000_001);
      store.addAvailableItem(1_000_002);

      expect(available({ from: 1_000_002 })).toEqual([1_000_002]);
    });

    it('makes a value above the default maximum selectable', () => {
      store.addAvailableItem(1_000_001);

      expect(() => store.addItemToSelection(1_000_001)).not.toThrow();
    });
  });

  describe('getAvailableItems', () => {
    it('starts from the minimum value by default', () => {
      const items = available();

      expect(items[0]).toBe(1);
      expect(items.slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('starts from `from` when provided', () => {
      const items = available({ from: 100 });

      expect(items[0]).toBe(100);
      expect(items.slice(0, 3)).toEqual([100, 101, 102]);
    });

    it('returns consecutive ascending values', () => {
      const items = available({ from: 50 });

      items.forEach((value, i) => expect(value).toBe(50 + i));
    });

    it('excludes selected items', () => {
      select(2, 3);

      const items = available();

      expect(items).not.toContain(2);
      expect(items).not.toContain(3);
      expect(items.slice(0, 3)).toEqual([1, 4, 5]);
    });

    it('does not run past the maximum value', () => {
      const items = available({ from: 1_000_000 });

      expect(items).toEqual([1_000_000]);
    });

    it('returns nothing when `from` is above the maximum', () => {
      expect(available({ from: 1_000_001 })).toEqual([]);
    });

    describe('search', () => {
      it('matches numbers by prefix', () => {
        const items = available({ search: '1' });

        expect(items[0]).toBe(1);
        expect(items).toContain(1);
        expect(items).toContain(12);
        expect(items).toContain(100);
        expect(items.length).toBe(20);
        expect(items.every(v => String(v).startsWith('1'))).toBe(true);
      });

      it('matches numbers by prefix after adding value', () => {
        store.addAvailableItem(1_000_001);
        const items = available({ search: '1000', from: 1_000_000 });

        expect(items[0]).toBe(1_000_000);
        expect(items[1]).toBe(1_000_001);
        expect(items.every(v => String(v).startsWith('1000'))).toBe(true);
      });

      it('finds numbers with more digits than the query', () => {
        const items = available({ search: '12', from: 120, limit: 5 });

        expect(items.length).toBeGreaterThan(0);
        expect(items.every(v => String(v).startsWith('12'))).toBe(true);
      });

      it('returns nothing for a non-numeric search', () => {
        expect(available({ search: 'abc' })).toEqual([]);
      });

      it('returns nothing when search exceeds the maximum value', () => {
        expect(available({ search: '1000001' })).toEqual([]);
      });

      it('excludes selected items from search results', () => {
        select(12);

        expect(available({ search: '12' })).not.toContain(12);
      });
    });
  });

  describe('addItemToSelection', () => {
    it('adds an item to the selection', () => {
      select(5);

      expect(selection()).toEqual([5]);
    });

    it.each([0, -1, 1_000_001])('rejects invalid value %p', value => {
      expect(() => store.addItemToSelection(value)).toThrow('Invalid item value');
      expect(selection()).toEqual([]);
    });

    it('accepts boundary values', () => {
      select(1, 1_000_000);

      expect(selection()).toEqual([1, 1_000_000]);
    });

    it('preserves insertion order', () => {
      select(1, 2, 3);

      expect(selection()).toEqual([1, 2, 3]);
    });
  });

  describe('removeItemFromSelection', () => {
    it('removes a selected item', () => {
      select(1, 2, 3);

      store.removeItemFromSelection(2);

      expect(selection()).toEqual([1, 3]);
    });

    it('makes the item available again', () => {
      select(1);
      expect(available()).not.toContain(1);

      store.removeItemFromSelection(1);

      expect(available()[0]).toBe(1);
    });

    it('is a no-op for items that are not selected', () => {
      select(1, 2);

      store.removeItemFromSelection(99);

      expect(selection()).toEqual([1, 2]);
    });
  });

  describe('getSelectionItems', () => {
    it('returns an empty list when nothing is selected', () => {
      expect(selection()).toEqual([]);
    });

    it('starts from `from` when provided', () => {
      select(1, 2, 3, 4);

      expect(selection({ from: 3 })).toEqual([3, 4]);
    });

    it('returns nothing when `from` is not selected', () => {
      select(1, 2, 3);

      expect(selection({ from: 10 })).toEqual([]);
    });

    it('returns nothing for a non-numeric search', () => {
      select(1, 2, 3);

      expect(selection({ search: 'abc' })).toEqual([]);
    });

    it('filters selected items by search prefix', () => {
      select(1, 12, 2, 123, 3, 122, 1234, 124412, 121111);
      const items = selection({ search: '1', limit: 5 });

      expect(items).toEqual([1, 12, 123, 122, 1234]);
    });

    it('does not return more than the default page size', () => {
      for (let i = 1; i <= 30; i++) select(i);

      expect(selection()).toHaveLength(20);
    });

    it('pages through the selection using `from`', () => {
      for (let i = 1; i <= 30; i++) select(i);

      const next = selection({ from: 21 });

      expect(next).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    });
  });

  describe('changeSelectionOrder', () => {
    beforeEach(() => select(1, 2, 3, 4));

    it('moves an item to the head', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveHead, src: 3 });
      const items = selection({ from: 3 });

      expect(items).toEqual([3, 1, 2, 4]);
    });

    it('moves an item to the tail', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveTail, src: 2 });

      expect(selection()).toEqual([1, 3, 4, 2]);
    });

    it('moves an item after a target', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveAfter, src: 1, target: 3 });
      const items = selection();

      expect(items).toEqual([2, 3, 1, 4]);
    });

    it('moves an item after a target located before it', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveAfter, src: 4, target: 1 });

      expect(selection()).toEqual([1, 4, 2, 3]);
    });

    it('keeps the order when an item is moved after its predecessor', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveAfter, src: 3, target: 2 });

      expect(selection()).toEqual([1, 2, 3, 4]);
    });

    it('ignores operations on items that are not selected', () => {
      store.changeSelectionOrder({ type: OrderChangeAction.MoveHead, src: 99 });
      store.changeSelectionOrder({ type: OrderChangeAction.MoveTail, src: 99 });
      store.changeSelectionOrder({ type: OrderChangeAction.MoveAfter, src: 99, target: 1 });
      store.changeSelectionOrder({ type: OrderChangeAction.MoveAfter, src: 1, target: 99 });

      expect(selection()).toEqual([1, 2, 3, 4]);
    });

    it('throws on an unknown operation type', () => {
      expect(() => store.changeSelectionOrder({ type: 99 } as never)).toThrow();
    });
  });
});
