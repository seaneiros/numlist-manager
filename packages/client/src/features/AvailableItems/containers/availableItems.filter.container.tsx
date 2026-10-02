import { useEffect, useState } from 'react';
import { useDebouncedValue }   from '../../../lib/hooks';

import { SearchOutlined }      from '@ant-design/icons';
import { Input }               from 'antd';
import { AvailableItemsStore } from '../../../store/availableItems.store';
import { asNumber }            from '../../../utils';


export const AvailableItemsFilterContainer = () => {
  const storedSearchValue = AvailableItemsStore(state => state.search);
  const reset = AvailableItemsStore(state => state.reset);

  const [ search, setSearch ] = useState(storedSearchValue);
  const searchValue = useDebouncedValue(search, 100);

  useEffect(() => {
    if (searchValue !== AvailableItemsStore.getState().search) {
      reset(searchValue);
    }
  }, [
    reset,
    searchValue,
  ]);

  return (
    <Input
      inputMode="numeric"
      placeholder="Search"
      aria-label="Search"
      prefix={<SearchOutlined />}
      value={search}
      onChange={event => setSearch(asNumber(event.target.value))}
      allowClear
    />
  );
};
