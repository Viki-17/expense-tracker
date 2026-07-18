import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { forwardRef, type ReactNode, useMemo } from 'react';

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

export function VirtualList<T>({
  items,
  rowHeight,
  height,
  renderRow,
  itemKey,
  overscan = 6,
  className = '',
}: VirtualListProps<T>) {
  const Row = useMemo(
    () =>
      ({ index, style }: ListChildComponentProps) => (
        <div style={style} className="px-0">
          {renderRow(items[index], index)}
        </div>
      ),
    [items, renderRow]
  );

  const keyExtractor = useMemo(
    () =>
      (index: number): string | number =>
        itemKey ? itemKey(items[index], index) : index,
    [itemKey, items]
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={rowHeight}
      width="100%"
      overscanCount={overscan}
      itemKey={keyExtractor}
      className={className}
    >
      {Row}
    </List>
  );
}