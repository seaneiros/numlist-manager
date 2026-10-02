import {
  useMemo,
  useState,
  useEffect,
  useCallback }                from 'react';
import { App, Button }         from 'antd';
import { SelectedItemsList }   from '../components/selectedItems.list';
import { AvailableItemsStore } from '../../../store/availableItems.store';
import { SelectedItemsStore }  from '../../../store/selectedItems.store';


export const SelectedItemsListContainer = ({ height }: { height: number }) => {
  const items = SelectedItemsStore(state => state.items);
  const next = SelectedItemsStore(state => state.next);
  const ready = SelectedItemsStore(state => state.ready);
  const status = SelectedItemsStore(state => state.status);
  const loadMore = SelectedItemsStore(state => state.loadMore);
  const removeItem = SelectedItemsStore(state => state.removeItem);
  const moveItem = SelectedItemsStore(state => state.moveItem);
  const addAvailableItem = AvailableItemsStore(state => state.addItem);

  const { message } = App.useApp();
  const [ pending, setPending ] = useState<ReadonlySet<number>>(new Set());

  const deselect = useCallback(async (value: number) => {
    setPending(prev => new Set(prev).add(value));

    try {
      await removeItem(value);
      addAvailableItem(value);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to remove the item');
    } finally {
      setPending(prev => {
        const next = new Set(prev);

        next.delete(value);

        return next;
      });
    }
  }, [ removeItem, addAvailableItem, message ]);

  const move = useCallback(async (src: number, target: number) => {
    try {
      await moveItem(src, target);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to change the order')
    }
  }, [ moveItem ]);

  const dataKey = 'val';
  const columns = useMemo(() => [
    { title: 'Selected values', dataIndex: dataKey, key: dataKey },
    {
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, row: Record<string, number>) => (
        <Button
          size="small"
          danger
          loading={pending.has(row[dataKey])}
          onClick={() => deselect(row[dataKey])}
        >
          Remove
        </Button>
      ),
    },
  ], [ pending, deselect ]);
  const data = useMemo(() => items.map(val => ({ [dataKey]: val })), [ items, dataKey ]);

  useEffect(() => { loadMore(); }, [loadMore]);

  return (
    <SelectedItemsList
      data={data}
      columns={columns}
      rowKey={dataKey}
      height={height}
      loading={status.request}
      error={status.failure ? status.failure.message : undefined}
      hasMore={!ready || next !== null}
      emptyText="No selected items"
      onLoadMore={loadMore}
      onRetry={loadMore}
      onMove={move}
    />
  );
};
