import { memo, useMemo, useRef, useLayoutEffect } from 'react';

interface MonthData {
  month: string;
  expense: number;
  income: number;
}

interface MonthBarChartProps {
  data: MonthData[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}

function MonthBarChartBase({ data, selectedMonth, onSelect }: MonthBarChartProps) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.expense), 1), [data]);
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
      <div className="flex gap-1.5 pb-2 min-w-max">
        {data.map((d) => {
          const active = d.month === selectedMonth;
          const pct = Math.max((d.expense / maxVal) * 100, 2);
          return (
            <button
              key={d.month}
              ref={active ? selectedRef : undefined}
              onClick={() => onSelect(d.month)}
              className="tap flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-colors min-w-[56px] active:scale-95"
            >
              <span
                className={`text-[10px] font-semibold ${
                  active ? 'text-accent' : 'text-tertiary'
                }`}
              >
                {formatCompactAmount(d.expense)}
              </span>
              <div className="flex items-end h-16 gap-[2px]">
                <div
                  className={`w-5 rounded-t-md transition-all ${
                    active ? 'bg-accent' : 'bg-[rgb(var(--surface-3))]'
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
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return value.toString();
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

export const MonthBarChart = memo(MonthBarChartBase);
