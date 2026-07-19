import { memo, useMemo, useRef, useLayoutEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface GroupBarData {
  month: string;
  total: number;
}

interface GroupBarChartProps {
  data: GroupBarData[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}

function GroupBarChartBase({ data, selectedMonth, onSelect }: GroupBarChartProps) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!scrollRef.current || !selectedRef.current) return;
    const container = scrollRef.current;
    const selected = selectedRef.current;
    const containerWidth = container.clientWidth;
    const selectedLeft = selected.offsetLeft;
    const selectedWidth = selected.clientWidth;
    container.scrollTo({
      left: selectedLeft - containerWidth / 2 + selectedWidth / 2,
      behavior: 'auto',
    });
  }, [selectedMonth]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto no-scrollbar -mx-3 px-3"
    >
      <div className="flex gap-2 pb-2 min-w-max">
        {data.map((d) => {
          const active = d.month === selectedMonth;
          const pct = Math.max((d.total / maxVal) * 100, 2);
          return (
            <button
              key={d.month}
              ref={active ? selectedRef : undefined}
              onClick={() => onSelect(d.month)}
              className="tap flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-colors min-w-[52px] active:scale-95"
            >
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  active ? 'text-accent' : 'text-tertiary'
                }`}
              >
                {formatCompactAmount(d.total)}
              </span>
              <div className="flex items-end h-14 w-full">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    active
                      ? 'bg-accent'
                      : 'bg-tertiary'
                  }`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  active ? 'text-accent' : 'text-tertiary'
                }`}
              >
                {formatMonthLabel(d.month)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatCompactAmount(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return formatCurrency(value).replace('.00', '');
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const now = new Date();
  const date = new Date(y, m - 1, 1);
  const monthShort = date.toLocaleDateString('en-IN', { month: 'short' });
  if (y === now.getFullYear()) {
    return monthShort;
  }
  const yearShort = date.toLocaleDateString('en-IN', { year: '2-digit' });
  return `${monthShort}'${yearShort}`;
}

export const GroupBarChart = memo(GroupBarChartBase);
