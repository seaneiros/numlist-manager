import { useEffect, useState } from 'react';
import { useDebouncedValue }   from '../../../lib/hooks';

import { SearchOutlined }      from '@ant-design/icons';
import { Input }               from 'antd';
import { SelectedItemsStore }  from '../../../store/selectedItems.store';
import { asNumber }            from '../../../utils';


export const SelectedItemsFilterContainer = () => {
  const storedSearchValue = SelectedItemsStore(state => state.search);
  const reset = SelectedItemsStore(state => state.reset);

  const [ search, setSearch ] = useState(storedSearchValue);
  const searchValue = useDebouncedValue(search, 100);

  useEffect(() => {
    if (searchValue !== SelectedItemsStore.getState().search) {
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
