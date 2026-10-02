import {
  Spin,
  Alert,
  Button,
  Empty,
  Table }                  from 'antd';
import type { TableProps } from 'antd';
import { UIEvent }         from 'react';


export interface ILazyTableProps<T> {
  data: T[];
  columns: NonNullable<TableProps<T>['columns']>;
  rowKey: keyof T & string;
  height: number;
  loading: boolean;
  error?: string;
  hasMore: boolean;
  emptyText?: string;
  components?: TableProps<T>['components'];
  onRow?: TableProps<T>['onRow'];
  onLoadMore(): void;
  onRetry(): void;
}

export const LazyTable = <T extends object>({
  data, columns, rowKey, height, loading, error, hasMore, emptyText = 'No items', components, onRow, onLoadMore, onRetry,
}: ILazyTableProps<T>) => {
  const handleScroll = ({ currentTarget }: UIEvent<HTMLElement>) => {
    const threshold = 80;
    const { scrollTop, clientHeight, scrollHeight } = currentTarget;

    if (hasMore && !loading && !error && scrollHeight - scrollTop - clientHeight < threshold) {
      onLoadMore();
    }
  };

  return (
    <>
      <Table<T>
        virtual
        size="small"
        rowKey={rowKey}
        columns={columns}
        dataSource={data}
        components={components}
        onRow={onRow}
        loading={loading && !data.length}
        pagination={false}
        scroll={{ y: height }}
        onScroll={handleScroll}
        locale={{ emptyText: loading ? ' ' : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} /> }}
      />

      {loading && !!data.length && (
        <div style={{ padding: 12, textAlign: 'center' }}>
          <Spin size="small" />
        </div>
      )}

      {error && (
        <Alert
          type="error"
          title={error}
          action={<Button size="small" onClick={onRetry}>Retry</Button>}
        />
      )}
    </>
  );
};
