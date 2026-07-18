import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

interface DonutEntry {
  name: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: DonutEntry[];
  total: number;
  size?: number;
}

function CategoryDonutChartBase({ data, total, size = 160 }: CategoryDonutChartProps) {
  const safeData = data.length > 0 ? data : [{ name: 'Empty', value: 1, color: 'rgb(var(--surface-3))' }];

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safeData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.48}
              paddingAngle={1}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {safeData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium text-tertiary uppercase tracking-wide">Spends</span>
          <span className="text-lg font-bold text-label">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-label truncate flex-1">{d.name}</span>
            <span className="text-xs font-semibold text-label">{formatCurrency(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CategoryDonutChart = memo(CategoryDonutChartBase);
