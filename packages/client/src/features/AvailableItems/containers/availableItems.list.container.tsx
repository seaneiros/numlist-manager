import {
  useMemo,
  useState,
  useEffect,
  useCallback }                from 'react';
import { PlusOutlined }       from '@ant-design/icons';
import { App, Button }         from 'antd';
import { LazyTable }           from '../../../components/LazyTable';
import { AvailableItemsStore } from '../../../store/availableItems.store';
import { SelectedItemsStore }  from '../../../store/selectedItems.store';


export const AvailableItemsListContainer = ({ height }: { height: number }) => {
  const items = AvailableItemsStore(state => state.items);
  const next = AvailableItemsStore(state => state.next);
  const ready = AvailableItemsStore(state => state.ready);
  const status = AvailableItemsStore(state => state.status);
  const loadMore = AvailableItemsStore(state => state.loadMore);
  const removeItem = AvailableItemsStore(state => state.removeItem);
  const addSelectedItem = SelectedItemsStore(state => state.addItem);

  const { message } = App.useApp();
  const [ pending, setPending ] = useState<ReadonlySet<number>>(new Set());

  const select = useCallback(async (value: number) => {
    setPending(prev => new Set(prev).add(value));

    try {
      await addSelectedItem(value);
      removeItem(value);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to select the item');
    } finally {
      setPending(prev => {
        const next = new Set(prev);

        next.delete(value);

        return next;
      });
    }
  }, [ addSelectedItem, removeItem, message ]);

  const dataKey = 'val';
  const columns = useMemo(() => [
    { title: 'Available values', dataIndex: dataKey, key: dataKey },
    {
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, row: Record<string, number>) => (
        <Button
          size="small"
          loading={pending.has(row[dataKey])}
          icon={<PlusOutlined />}
          onClick={() => select(row[dataKey])}
        >
          Add
        </Button>
      ),
    },
  ], [ pending, select ]);
  const data = useMemo(() => items.map(val => ({ [dataKey]: val })), [ items, dataKey ]);

  useEffect(() => { loadMore(); }, [loadMore]);

  return (
    <LazyTable
      data={data}
      columns={columns}
      rowKey={dataKey}
      height={height}
      loading={status.request}
      error={status.failure ? status.failure.message : undefined}
      hasMore={!ready || next !== null}
      emptyText="No available items"
      onLoadMore={loadMore}
      onRetry={loadMore}
    />
  );
};
