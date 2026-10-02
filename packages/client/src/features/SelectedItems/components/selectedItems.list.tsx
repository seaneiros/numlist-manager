import {
  forwardRef,
  useMemo,
  HTMLAttributes }                    from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors }                        from '@dnd-kit/core';
import {
  verticalListSortingStrategy,
  SortableContext,
  useSortable }                       from '@dnd-kit/sortable';
import { CSS }                        from '@dnd-kit/utilities';
import { ILazyTableProps, LazyTable } from '../../../components/LazyTable';


export interface ISelectedItemsListProps<T extends object> extends Omit<ILazyTableProps<T>, 'components' | 'onRow'> {
  onMove(src: number, over: number): void;
}

export const SelectedItemsList = <T extends object>({ onMove, ...tableProps }: ISelectedItemsListProps<T>) => {
  const { data, rowKey } = tableProps;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => data.map(row => row[rowKey] as number), [ data, rowKey ]);
  const components = useMemo(() => ({ body: { row: SortableRow } }), []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onMove(Number(active.id), Number(over.id));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <LazyTable<T>
          {...tableProps}
          components={components}
          onRow={row => ({ 'data-row-key': row[rowKey] } as HTMLAttributes<HTMLElement>)}
        />
      </SortableContext>
    </DndContext>
  );
};


/* HELPERS */

const SortableRow = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { 'data-row-key'?: number }>(
  ({ style, ...props }, ref) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props['data-row-key'] as number });

    return (
      <div
        {...props}
        {...attributes}
        {...listeners}
        ref={node => {
          setNodeRef(node);

          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={{
          ...style,
          // vertical moves only
          transform: CSS.Transform.toString(transform && { ...transform, x: 0, scaleX: 1, scaleY: 1 }),
          transition,
          cursor: 'grab',
          ...(isDragging ? { position: 'relative', zIndex: 1, opacity: 0.8 } : null),
        }}
      />
    );
  },
);
