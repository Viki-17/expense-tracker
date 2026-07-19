import { useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from './Avatar';
import { categoryColor } from '../../utils/categories';
import { CategoryIcon } from '../Icons';
import type { Category } from '../../types';

interface Props {
  categories: Category[];
  anchorRect: DOMRect;
  onSelect: (category: string) => void;
  onClose: () => void;
}

export function CategoryPicker({ categories, anchorRect, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const style = useMemo(() => {
    const gap = 8;
    const maxH = 320;
    const pickerW = 220;
    let top = anchorRect.bottom + gap;
    let left = anchorRect.left;

    if (left + pickerW > window.innerWidth - 12) {
      left = window.innerWidth - pickerW - 12;
    }
    if (left < 12) left = 12;

    if (top + maxH > window.innerHeight - 12) {
      top = anchorRect.top - maxH - gap;
      if (top < 12) top = 12;
    }

    return { top, left, maxHeight: maxH };
  }, [anchorRect]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[100] bg-surface rounded-2xl shadow-xl border border-separator/30 overflow-hidden"
      style={{ width: 220, top: style.top, left: style.left, maxHeight: style.maxHeight }}
    >
      <div className="overflow-y-auto max-h-[320px] py-1.5">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-surface-2 active:bg-surface-2 transition-colors text-left"
          >
            <Avatar size="sm" color={categoryColor(cat)} icon={<CategoryIcon name={cat.name} />} />
            <span className="text-sm font-medium text-label truncate">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
}
