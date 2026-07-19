import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { type ReactNode, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  renderRow: (item: T, index: number) => ReactNode;
  /* Optional key extractor for stable component identity (uses index if omitted) */
  itemKey?: (item: T, index: number) => string | number;
  overscan?: number;
  className?: string;
}

interface ItemData<T> {
  items: T[];
  renderRow: (item: T, index: number) => ReactNode;
}

function Row({ index, style, data }: ListChildComponentProps<ItemData<unknown>>) {
  return (
    <div style={style} className="px-0">
      {data.renderRow(data.items[index], index)}
    </div>
  );
}

export function VirtualList<T>({
  items,
  rowHeight,
  height,
  renderRow,
  itemKey,
  overscan = 6,
  className = '',
}: VirtualListProps<T>) {
  const itemData = useMemo<ItemData<T>>(
    () => ({ items, renderRow }),
    [items, renderRow]
  );

  const keyExtractor = useCallback(
    (index: number): string | number =>
      itemKey ? itemKey(items[index], index) : index,
    [itemKey, items]
  );

  return (
    <List<ItemData<T>>
      height={height}
      itemCount={items.length}
      itemSize={rowHeight}
      width="100%"
      overscanCount={overscan}
      itemKey={keyExtractor}
      itemData={itemData}
      className={className}
    >
      {Row as unknown as (props: ListChildComponentProps<ItemData<T>>) => ReactNode}
    </List>
  );
}